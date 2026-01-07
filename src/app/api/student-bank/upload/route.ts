import { NextResponse } from 'next/server';
import { type StudentResource } from '@/lib/student-bank';
import { requireAuthedUser } from '@/lib/server-auth';
import { getAdmin } from '@/lib/firebase-admin';
import { createHash } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getStudentResourcesBucket, isS3Configured } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UploadJsonPayload = {
  title?: string;
  description?: string;
  university?: string;
  faculty?: string;
  course?: string;
  year?: string;
  type?: string;
  language?: string;
  subjectTags?: string[] | string;
  driveLink?: string;
  testOnly?: boolean;
};

const ALLOWED_TYPES: StudentResource['type'][] = [
  'exam',
  'assignment',
  'notes',
  'report',
  'book',
  'other',
];

// Basic server-side file validation
const MAX_FILE_BYTES =
  Number(process.env.STUDENT_BANK_MAX_FILE_BYTES || 40 * 1024 * 1024); // default ~40MB

const ALLOWED_DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

const UPLOAD_RATE_LIMIT_WINDOW_MS = Number(
  process.env.STUDENT_BANK_UPLOAD_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000,
); // 1 hour
const UPLOAD_RATE_LIMIT_MAX = Number(
  process.env.STUDENT_BANK_UPLOAD_RATE_LIMIT_MAX || 10,
); // per window, per uid+ipHash

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return String(xff).split(',')[0]?.trim() || '0.0.0.0';
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return String(realIp).trim();
  return '0.0.0.0';
}

function hashKey(raw: string): string {
  const salt = process.env.STUDENT_BANK_UPLOAD_RATE_LIMIT_SALT || 'khidmaty-student-upload';
  return createHash('sha256').update(`${salt}:${raw}`).digest('hex');
}

function normalizeType(raw?: string | null): StudentResource['type'] {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'notes';
  const match = ALLOWED_TYPES.find((t) => t === s);
  return (match as StudentResource['type']) || 'notes';
}

function normalizeLanguage(raw?: string | null): StudentResource['language'] {
  const s = String(raw || '').toLowerCase();
  if (s === 'ar' || s === 'both') return s;
  return 'en';
}

function sanitizeDriveLink(raw?: string | null): string | undefined {
  const s = String(raw || '').trim();
  if (!s) return undefined;
  try {
    const url = new URL(s);
    if (url.protocol !== 'https:') return undefined;
    if (!ALLOWED_DRIVE_HOSTS.includes(url.hostname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function safePdfFilename(rawName: string): string {
  const name = String(rawName || '').trim() || `resource_${Date.now()}.pdf`;
  const base = name.split(/[\\/]/).pop() || name;
  const normalized = base
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
  const withExt = normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
  return withExt.replace(/\.pdf\.pdf$/i, '.pdf');
}

function isPdfByName(name: string): boolean {
  return /\.pdf$/i.test(name || '');
}

function isPdfMagic(buf: Buffer): boolean {
  if (!buf || buf.length < 5) return false;
  return buf.subarray(0, 5).toString('utf8') === '%PDF-';
}

async function enforceUploadsEnabled(db: any): Promise<boolean> {
  try {
    const doc = await db.collection('app_settings').doc('student_bank').get();
    const data = (doc.exists ? (doc.data() as any) : null) || {};
    return typeof data.uploadsEnabled === 'boolean' ? data.uploadsEnabled : true;
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  try {
    const { db, FieldValue } = await getAdmin();
    const uploadsEnabled = await enforceUploadsEnabled(db);
    if (!uploadsEnabled) {
      return NextResponse.json({ ok: false, code: 'uploads_disabled' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    let title = '';
    let description: string | undefined;
    let university: string | undefined;
    let faculty: string | undefined;
    let course: string | undefined;
    let year: string | undefined;
    let type: StudentResource['type'] = 'notes';
    let language: StudentResource['language'] = 'en';
    let file: File | null = null;
    let subjectTags: string[] | undefined;
    let manualDriveLink: string | undefined;
    let testOnly = false;

    if (contentType.includes('multipart/form-data')) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('too large') || msg.includes('payload') || msg.includes('entity too large')) {
          return NextResponse.json({ ok: false, code: 'payload_too_large' }, { status: 413 });
        }
        throw e;
      }
      title = String(form.get('title') || '').trim();
      description = String(form.get('description') || '').trim() || undefined;
      university = String(form.get('university') || '').trim() || undefined;
      faculty = String(form.get('faculty') || '').trim() || undefined;
      course = String(form.get('course') || '').trim() || undefined;
      year = String(form.get('year') || '').trim() || undefined;
      type = normalizeType(form.get('type') as string | null);
      language = normalizeLanguage(form.get('language') as string | null);
      testOnly = String(form.get('testOnly') || '').trim() === '1';
      const rawDriveLink = String(form.get('driveLink') || '').trim();
      if (rawDriveLink) {
        const safe = sanitizeDriveLink(rawDriveLink);
        if (!safe) {
          return NextResponse.json({ ok: false, code: 'invalid_drive_link' }, { status: 400 });
        }
        manualDriveLink = safe;
      }
      const rawTags = String(form.get('subjectTags') || '').trim();
      if (rawTags) {
        subjectTags = rawTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      const f = form.get('file');
      if (f instanceof File) {
        // Enforce simple size/type limits
        if (f.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { ok: false, code: 'file_too_large', maxBytes: MAX_FILE_BYTES },
            { status: 413 },
          );
        }
        file = f;
      }
    } else {
      let payload: UploadJsonPayload | null = null;
      try {
        payload = (await req.json()) as UploadJsonPayload;
      } catch {
        payload = null;
      }
      if (!payload) {
        return NextResponse.json({ ok: false, code: 'invalid_body' }, { status: 400 });
      }
      title = String(payload.title || '').trim();
      description = payload.description?.trim() || undefined;
      university = payload.university?.trim() || undefined;
      faculty = payload.faculty?.trim() || undefined;
      course = payload.course?.trim() || undefined;
      year = payload.year?.trim() || undefined;
      type = normalizeType(payload.type);
      language = normalizeLanguage(payload.language);
      testOnly = Boolean(payload.testOnly);
      if (payload.driveLink) {
        const safe = sanitizeDriveLink(payload.driveLink);
        if (!safe) {
          return NextResponse.json({ ok: false, code: 'invalid_drive_link' }, { status: 400 });
        }
        manualDriveLink = safe;
      }
      if (payload.subjectTags) {
        if (Array.isArray(payload.subjectTags)) {
          subjectTags = payload.subjectTags
            .map((t) => String(t).trim())
            .filter(Boolean);
        } else if (typeof payload.subjectTags === 'string') {
          subjectTags = payload.subjectTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
    }

    if (!title) {
      return NextResponse.json({ ok: false, code: 'missing_title' }, { status: 400 });
    }

    // Require a signed-in user for uploads
    const authInfo = await requireAuthedUser(req);
    if (!authInfo.ok) {
      return NextResponse.json({ ok: false, code: authInfo.error }, { status: authInfo.code });
    }
    const uploaderId: string | undefined = authInfo.uid;

    // Rate limit uploads per uid + ip hash
    try {
      const ip = getClientIp(req);
      const ipHash = hashKey(ip);
      const nowMs = Date.now();
      const limitRef = db.collection('rate_limits').doc(`student_upload_${uploaderId}_${ipHash}`);
      const limit = await db.runTransaction(async (t: any) => {
        const snap = await t.get(limitRef);
        const data = (snap.exists ? (snap.data() || {}) : {}) as any;
        const windowStartMs = typeof data.windowStartMs === 'number' ? data.windowStartMs : 0;
        const count = typeof data.count === 'number' ? data.count : 0;

        const freshWindow = !windowStartMs || (nowMs - windowStartMs) > UPLOAD_RATE_LIMIT_WINDOW_MS;
        const start = freshWindow ? nowMs : windowStartMs;
        const nextCount = freshWindow ? 1 : (count + 1);

        if (!freshWindow && count >= UPLOAD_RATE_LIMIT_MAX) {
          return { ok: false as const };
        }

        t.set(
          limitRef,
          { windowStartMs: start, count: nextCount, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
        return { ok: true as const };
      });

      if (!limit.ok) {
        return NextResponse.json({ ok: false, code: 'rate_limited' }, { status: 429 });
      }
    } catch {
      // non-fatal: do not block uploads if rate limiter fails
    }

    let pdfKey: string | undefined;
    let driveLink: string | undefined;

    if (file) {
      const cfg = isS3Configured();
      if (!cfg.ok) {
        return NextResponse.json({ ok: false, code: 'storage_not_configured', missing: cfg.missing }, { status: 400 });
      }

      // Strict PDF validation
      const filename = safePdfFilename(file.name || 'resource.pdf');
      if (file.type && file.type !== 'application/pdf') {
        return NextResponse.json({ ok: false, code: 'invalid_pdf' }, { status: 400 });
      }
      if (!file.type && !isPdfByName(filename)) {
        return NextResponse.json({ ok: false, code: 'invalid_pdf' }, { status: 400 });
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(await file.arrayBuffer());
      } catch {
        return NextResponse.json({ ok: false, code: 'invalid_pdf' }, { status: 400 });
      }
      if (!isPdfMagic(buffer)) {
        return NextResponse.json({ ok: false, code: 'invalid_pdf' }, { status: 400 });
      }

      // Create a resource id first so the object key is stable
      const docRef = db.collection('student_resources').doc();
      const resourceId = docRef.id;
      const bucket = getStudentResourcesBucket();
      pdfKey = `student-resources/${uploaderId}/${resourceId}/${filename}`;

      try {
        const s3 = getS3Client();
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: pdfKey,
            Body: buffer,
            ContentType: 'application/pdf',
          }),
        );
      } catch (e) {
        console.error('MinIO upload failed', e);
        return NextResponse.json({ ok: false, code: 'storage_upload_failed' }, { status: 500 });
      }

      const clean = Object.fromEntries(
        Object.entries({
          title: String(title || '').trim(),
          description,
          university,
          faculty,
          course,
          year,
          type,
          language,
          status: 'pending',
          readCount: 0,
          subjectTags: subjectTags?.length ? subjectTags : undefined,
          pdfKey,
          pdfBucket: bucket,
          uploaderId,
          hiddenFromOwner: testOnly || undefined,
          createdAt: typeof FieldValue?.serverTimestamp === 'function' ? FieldValue.serverTimestamp() : new Date(),
        }).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      );

      await docRef.set(clean, { merge: false });
      return NextResponse.json({ ok: true, id: resourceId });
    }

    // Legacy/manual link (used when host rejects large uploads with 413)
    if (manualDriveLink) {
      driveLink = manualDriveLink;
    }

    // Metadata-only resource creation (pending)
    const docRef = db.collection('student_resources').doc();
    const resourceId = docRef.id;
    const clean = Object.fromEntries(
      Object.entries({
        title: String(title || '').trim(),
        description,
        university,
        faculty,
        course,
        year,
        type,
        language,
        status: 'pending',
        readCount: 0,
        subjectTags: subjectTags?.length ? subjectTags : undefined,
        driveLink: driveLink || undefined,
        uploaderId,
        hiddenFromOwner: testOnly || undefined,
        createdAt: typeof FieldValue?.serverTimestamp === 'function' ? FieldValue.serverTimestamp() : new Date(),
      }).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
    await docRef.set(clean, { merge: false });
    return NextResponse.json({ ok: true, id: resourceId });
  } catch (err: any) {
    console.error('student-bank upload error', err);
    return NextResponse.json(
      { ok: false, code: 'failed_to_upload_student_resource' },
      { status: 500 },
    );
  }
}
