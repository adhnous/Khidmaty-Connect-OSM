import { NextResponse } from 'next/server';
import { getSosAdmin } from '@/lib/firebase-admin-sos';
import { cleanString, normalizePhone, requireAuthedSosUser, withCors } from '../_shared';

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
    const { auth, db, Timestamp } = getSosAdmin();

    let uid = '';
    try {
      uid = (await requireAuthedSosUser(req, auth)).uid;
    } catch {
      return unauthorized();
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const phone = normalizePhone(body?.phone);
    if (!phone) return badRequest('Invalid phone number. Use +<countrycode>... (or 00...).');

    const now = Timestamp.now();
    const userRef = db.collection('users').doc(uid);
    const phoneRef = db.collection('phone_index').doc(phone);

    try {
      await db.runTransaction(async (tx: any) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) throw new Error('user_missing');

        const existingPhone = cleanString(userSnap.get('phone'));
        if (existingPhone && existingPhone !== phone) throw new Error('phone_already_set');

        const phoneSnap = await tx.get(phoneRef);
        const existingUid = phoneSnap.exists ? cleanString(phoneSnap.get('uid')) : '';
        if (existingUid && existingUid !== uid) throw new Error('phone_in_use');

        if (!phoneSnap.exists) {
          tx.set(phoneRef, { uid, createdAt: now, updatedAt: now });
        } else {
          tx.set(phoneRef, { uid, updatedAt: now }, { merge: true });
        }

        tx.set(userRef, { phone, phoneUpdatedAt: now, updatedAt: now }, { merge: true });
      });
    } catch (e) {
      const msg = cleanString((e as any)?.message);
      if (msg === 'user_missing') {
        return withCors(NextResponse.json({ error: 'failed_precondition', detail: 'User profile not found.' }, { status: 412 }));
      }
      if (msg === 'phone_already_set') {
        return withCors(
          NextResponse.json({ error: 'failed_precondition', detail: 'Phone number is already set for this account.' }, { status: 412 }),
        );
      }
      if (msg === 'phone_in_use') {
        return withCors(
          NextResponse.json({ error: 'already_exists', detail: 'Phone number is already in use.' }, { status: 409 }),
        );
      }
      throw e;
    }

    return withCors(NextResponse.json({ ok: true, phone }));
  } catch (err) {
    console.error('[api/sos/set-phone] failed', err);
    return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }));
  }
}

