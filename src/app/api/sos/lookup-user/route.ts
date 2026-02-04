import { NextResponse } from 'next/server';
import { getSosAdmin } from '@/lib/firebase-admin-sos';
import { cleanEmail, cleanString, normalizePhone, requireAuthedSosUser, withCors } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function badRequest(detail: string) {
  return withCors(NextResponse.json({ error: 'invalid_request', detail }, { status: 400 }));
}

function unauthorized() {
  return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: Request) {
  try {
    const { auth, db } = getSosAdmin();

    try {
      await requireAuthedSosUser(req, auth);
    } catch {
      return unauthorized();
    }

    const body = (await req.json().catch(() => ({}))) as any;

    const emailRaw = cleanEmail(body?.email);
    const phone = normalizePhone(body?.phone);

    if (!emailRaw && !phone) return badRequest('Provide email or phone.');

    if (emailRaw) {
      if (!emailRaw.includes('@') || emailRaw.length > 254) return badRequest('Invalid email.');
      const snap = await db.collection('users').where('email', '==', emailRaw).limit(1).get();
      const uid = snap.empty ? null : cleanString(snap.docs[0]?.id);
      return withCors(NextResponse.json({ uid: uid || null }));
    }

    if (!phone) return badRequest('Invalid phone number.');

    const doc = await db.collection('phone_index').doc(phone).get();
    const uid = doc.exists ? cleanString(doc.get('uid')) : '';
    return withCors(NextResponse.json({ uid: uid || null }));
  } catch (err) {
    console.error('[api/sos/lookup-user] failed', err);
    return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }));
  }
}

