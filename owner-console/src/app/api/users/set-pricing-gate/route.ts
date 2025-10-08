import { NextResponse } from 'next/server';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

  const body = await req.json().catch(() => ({}));
  const uid = (body?.uid || '').trim();
  if (!uid) return NextResponse.json({ error: 'uid_required' }, { status: 400 });

  const { db } = await getAdmin();

  const pg: any = {};
  // mode
  if (body?.mode === 'force_show' || body?.mode === 'force_hide') {
    pg.mode = body.mode;
  } else if (body?.mode === null) {
    pg.mode = null;
  }
  // showAt
  if (body?.showAt) {
    const v = new Date(body.showAt);
    if (!isNaN(v.getTime())) pg.showAt = v;
  } else if (body?.showAt === null) {
    pg.showAt = null;
  }
  // months
  if (body?.enforceAfterMonths != null) {
    const n = Math.max(0, Math.floor(Number(body.enforceAfterMonths)));
    if (Number.isFinite(n)) pg.enforceAfterMonths = n; else pg.enforceAfterMonths = null;
  }

  try {
    const ref = db.collection('users').doc(uid);
    await ref.set({ pricingGate: pg }, { merge: true });
    const snap = await ref.get();
    const data = snap.data() || {};
    return NextResponse.json({ ok: true, pricingGate: data.pricingGate || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'update_failed' }, { status: 500 });
  }
}
