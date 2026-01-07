import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAdmin } from '@/lib/firebase-admin';
import { getS3PresignClient, getStudentResourcesBucket, isS3Configured } from '@/lib/s3';

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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const key = String(body?.key || '').trim();
    if (!key) return NextResponse.json({ ok: false, code: 'key_required' }, { status: 400 });
    if (!key.startsWith('student-resources/')) {
      return NextResponse.json({ ok: false, code: 'invalid_key' }, { status: 400 });
    }

    const cfg = isS3Configured();
    if (!cfg.ok) {
      return NextResponse.json({ ok: false, code: 'storage_not_configured', missing: cfg.missing }, { status: 400 });
    }

    const { db } = await getAdmin();

    // Find matching resource document for authorization (pdfKey is included in list output)
    const snap = await db.collection('student_resources').where('pdfKey', '==', key).limit(1).get();
    if (snap.empty) return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404 });
    const doc = snap.docs[0];
    const data = doc.data() || {};

    const status = String(data.status || 'pending');
    const uploaderId = String(data.uploaderId || '');

    const authed = await maybeAuth(req);
    if (status !== 'approved') {
      if (!authed) return NextResponse.json({ ok: false, code: 'forbidden' }, { status: 403 });
      const role = await roleForUid(db, authed.uid);
      const isAdmin = role === 'admin' || role === 'owner';
      const isOwner = uploaderId && uploaderId === authed.uid;
      if (!isAdmin && !isOwner) return NextResponse.json({ ok: false, code: 'forbidden' }, { status: 403 });
    }

    const bucket = String(data.pdfBucket || '') || getStudentResourcesBucket();
    const s3 = getS3PresignClient();

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: 'inline',
      }),
      { expiresIn: 60 * 10 },
    );

    return NextResponse.json({ ok: true, url, expiresInSec: 60 * 10 });
  } catch (err: any) {
    console.error('student-bank signed-url error', err);
    return NextResponse.json({ ok: false, code: 'failed_to_sign' }, { status: 500 });
  }
}
