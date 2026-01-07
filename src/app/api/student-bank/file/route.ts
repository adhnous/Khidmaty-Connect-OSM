import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getAdmin } from '@/lib/firebase-admin';
import { getS3Client, getStudentResourcesBucket, isS3Configured } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function maybeAuth(req: Request): Promise<{ uid: string } | null> {
  const authz = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) return null;
  try {
    const { auth } = await getAdmin();
    const decoded = await auth.verifyIdToken(m[1], true);
    return { uid: String(decoded.uid || '') };
  } catch {
    return null;
  }
}

async function roleForUid(db: any, uid: string): Promise<string | null> {
  try {
    const snap = await db.collection('users').doc(uid).get();
    return (snap.exists ? (snap.data() || {}).role : null) as string | null;
  } catch {
    return null;
  }
}

function filenameFromKey(key: string): string {
  const base = key.split('/').pop() || 'resource.pdf';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

function toWebStream(body: any): ReadableStream<Uint8Array> {
  if (!body) throw new Error('missing_body');
  if (typeof body?.getReader === 'function') return body as ReadableStream<Uint8Array>;
  if (typeof body?.pipe === 'function') return Readable.toWeb(body as Readable) as any;
  throw new Error('unsupported_body');
}

// GET /api/student-bank/file?key=student-resources/...
// Streams the PDF from S3/MinIO from the same origin (iframe-safe).
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = String(url.searchParams.get('key') || '').trim();
    if (!key) return NextResponse.json({ ok: false, code: 'key_required' }, { status: 400 });
    if (!key.startsWith('student-resources/')) {
      return NextResponse.json({ ok: false, code: 'invalid_key' }, { status: 400 });
    }

    const cfg = isS3Configured();
    if (!cfg.ok) {
      return NextResponse.json(
        { ok: false, code: 'storage_not_configured', missing: cfg.missing },
        { status: 400 },
      );
    }

    const { db } = await getAdmin();
    const snap = await db
      .collection('student_resources')
      .where('pdfKey', '==', key)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404 });

    const doc = snap.docs[0];
    const data = doc.data() || {};

    // Match public listing behavior: legacy items without a status are treated as approved.
    const status = data.status ? String(data.status) : 'approved';
    const uploaderId = String(data.uploaderId || '');

    if (status !== 'approved') {
      const authed = await maybeAuth(req);
      if (!authed) return NextResponse.json({ ok: false, code: 'forbidden' }, { status: 403 });
      const role = await roleForUid(db, authed.uid);
      const isAdmin = role === 'admin' || role === 'owner';
      const isOwner = uploaderId && uploaderId === authed.uid;
      if (!isAdmin && !isOwner) return NextResponse.json({ ok: false, code: 'forbidden' }, { status: 403 });
    }

    const s3 = getS3Client();
    const bucket = String(data.pdfBucket || '') || getStudentResourcesBucket();
    const out = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    const body = toWebStream((out as any).Body);
    const filename = filenameFromKey(key);

    return new Response(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        // Keep conservative caching (avoid leaking non-approved files).
        'Cache-Control': status === 'approved' ? 'public, max-age=300' : 'private, no-store',
      },
    });
  } catch (err: any) {
    console.error('student-bank file proxy error', err);
    return NextResponse.json({ ok: false, code: 'proxy_failed' }, { status: 500 });
  }
}
