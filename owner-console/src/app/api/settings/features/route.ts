import { NextResponse } from 'next/server';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULTS = {
  pricingEnabled: true,
  showForProviders: false,
  showForSeekers: false,
  enforceAfterMonths: 3,
  lockAllToPricing: false,
  lockProvidersToPricing: false,
  lockSeekersToPricing: false,
};

export async function GET(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

  const { db } = await getAdmin();
  const snap = await db.collection('settings').doc('features').get();
  const data = snap.exists ? snap.data() || {} : {};
  const out = {
    pricingEnabled: typeof data.pricingEnabled === 'boolean' ? data.pricingEnabled : DEFAULTS.pricingEnabled,
    showForProviders: typeof data.showForProviders === 'boolean' ? data.showForProviders : DEFAULTS.showForProviders,
    showForSeekers: typeof data.showForSeekers === 'boolean' ? data.showForSeekers : DEFAULTS.showForSeekers,
    enforceAfterMonths: Number.isFinite(data.enforceAfterMonths) ? Number(data.enforceAfterMonths) : DEFAULTS.enforceAfterMonths,
    lockAllToPricing: !!data.lockAllToPricing,
    lockProvidersToPricing: !!data.lockProvidersToPricing,
    lockSeekersToPricing: !!data.lockSeekersToPricing,
  };
  return NextResponse.json({ features: out });
}

export async function POST(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

  const body = await req.json().catch(() => ({}));
  const next = {
    pricingEnabled: !!body.pricingEnabled,
    showForProviders: !!body.showForProviders,
    showForSeekers: !!body.showForSeekers,
    enforceAfterMonths: Math.max(0, Math.floor(Number(body.enforceAfterMonths ?? DEFAULTS.enforceAfterMonths))),
    lockAllToPricing: !!body.lockAllToPricing,
    lockProvidersToPricing: !!body.lockProvidersToPricing,
    lockSeekersToPricing: !!body.lockSeekersToPricing,
  };

  const { db } = await getAdmin();
  await db.collection('settings').doc('features').set(next, { merge: true });

  return NextResponse.json({ ok: true, features: next });
}
