import { NextResponse } from 'next/server';
import {
  createStudentResource,
  folderIdForType,
  type StudentResource,
} from '@/lib/student-bank';
import { requireAuthedUser } from '@/lib/server-auth';
import { uploadStudentFileToDrive } from '@/lib/google-drive-student';

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
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const ALLOWED_DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

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

export async function POST(req: Request) {
  try {
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
      const form = await req.formData();
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
          return NextResponse.json({ error: 'invalid_drive_link' }, { status: 400 });
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
            { error: 'file_too_large', maxBytes: MAX_FILE_BYTES },
            { status: 413 },
          );
        }
        if (f.type && !ALLOWED_FILE_TYPES.includes(f.type)) {
          return NextResponse.json(
            { error: 'unsupported_file_type', allowedTypes: ALLOWED_FILE_TYPES },
            { status: 400 },
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
        return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
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
          return NextResponse.json({ error: 'invalid_drive_link' }, { status: 400 });
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
      return NextResponse.json({ error: 'missing_title' }, { status: 400 });
    }

    // Require a signed-in user for uploads
    const authInfo = await requireAuthedUser(req);
    if (!authInfo.ok) {
      return NextResponse.json({ error: authInfo.error }, { status: authInfo.code });
    }
    const uploaderId: string | undefined = authInfo.uid;

    let driveFileId: string | undefined;
    let driveLink: string | undefined;

    const folderId = folderIdForType(type);

    if (file && folderId) {
      try {
        const uploaded = await uploadStudentFileToDrive({
          file,
          folderId,
          title,
          type,
        });
        driveFileId = uploaded.fileId;
        driveLink = uploaded.webViewLink;
      } catch (e) {
        // Keep behaviour as before: log the error
        // but continue storing the metadata so the
        // owner can still see the resource.
        console.error('Drive upload failed, continuing with metadata only', e);
      }
    }

    if (!driveLink && manualDriveLink) {
      driveLink = manualDriveLink;
    }

    const id = await createStudentResource({
      title,
      description,
      university,
      faculty,
      course,
      year,
      type,
      language,
      subjectTags,
      driveFileId,
      driveLink,
      uploaderId,
      hiddenFromOwner: testOnly || undefined,
      status: 'pending',
    });


    return NextResponse.json({
      ok: true,
      id,
    });
  } catch (err: any) {
    console.error('student-bank upload error', err);
    return NextResponse.json(
      { error: 'failed_to_upload_student_resource' },
      { status: 500 },
    );
  }
}
