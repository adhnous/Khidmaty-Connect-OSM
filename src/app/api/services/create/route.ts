import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { buildServiceCreateDoc } from '@/lib/service-normalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyBearer(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return { ok: false as const, code: 401, error: 'missing_token' } as const;
  const token = authHeader.slice(7);
  try {
    const { auth, db } = await getAdmin();
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid as string;
    const userSnap = await db.collection('users').doc(uid).get();
    const role = (userSnap.exists ? (userSnap.get('role') as string) : null) || null;
    return { ok: true as const, uid, role, db };
  } catch (e) {
    return { ok: false as const, code: 401, error: 'invalid_token' } as const;
  }
}

// Providers can create services (beta restriction removed)
export async function POST(req: Request) {
  try {
    const authz = await verifyBearer(req);
    if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

    const { uid, role, db } = authz;
    const body = await req.json().catch(() => ({}));

    // Only providers can use this endpoint (admins should use the owner-console)
    if (role !== 'provider') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const providerName = (body.providerName && typeof body.providerName === 'string') ? body.providerName : null;
    const providerEmail = (body.providerEmail && typeof body.providerEmail === 'string') ? body.providerEmail : null;
    const payload = buildServiceCreateDoc(body, { providerId: uid, providerName, providerEmail, createdAt: new Date() });

    if (!payload.title) return NextResponse.json({ error: 'title_required' }, { status: 400 });

    // Strip undefined so Firestore accepts the document
    const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

    const ref = await db.collection('services').add(clean);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err: any) {
    const msg = err?.message || 'internal_error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
