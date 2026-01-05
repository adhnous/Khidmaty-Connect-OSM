import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

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

    // Build payload (strict allowlist)
    const payload: any = {
      title: typeof body.title === 'string' ? body.title : '',
      description: typeof body.description === 'string' ? body.description : '',
      price: Number.isFinite(body.price) ? Number(body.price) : 0,
      priceMode: (['firm','negotiable','call','hidden'] as const).includes(String(body.priceMode || '').toLowerCase() as any)
        ? String(body.priceMode).toLowerCase()
        : 'firm',
      showPriceInContact: typeof body.showPriceInContact === 'boolean' ? !!body.showPriceInContact : false,
      category: typeof body.category === 'string' ? body.category : '',
      city: typeof body.city === 'string' ? body.city : 'Tripoli',
      area: typeof body.area === 'string' ? body.area : '',
      availabilityNote: typeof body.availabilityNote === 'string' ? body.availabilityNote : '',
      lat: Number.isFinite(body.lat) ? Number(body.lat) : undefined,
      lng: Number.isFinite(body.lng) ? Number(body.lng) : undefined,
      mapUrl: (typeof body.mapUrl === 'string' && body.mapUrl) ? body.mapUrl : undefined,
      images: Array.isArray(body.images) ? body.images.filter((i: any) => i && typeof i.url === 'string') : [],
      contactPhone: typeof body.contactPhone === 'string' ? body.contactPhone : undefined,
      contactWhatsapp: typeof body.contactWhatsapp === 'string' ? body.contactWhatsapp : undefined,
      acceptRequests: typeof body.acceptRequests === 'boolean' ? body.acceptRequests : true,
      videoUrl: typeof body.videoUrl === 'string' ? body.videoUrl : undefined,
      videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls.filter((v: any) => typeof v === 'string' && v) : undefined,
      facebookUrl: typeof body.facebookUrl === 'string' ? body.facebookUrl : undefined,
      telegramUrl: typeof body.telegramUrl === 'string' ? body.telegramUrl : undefined,
      subservices: Array.isArray(body.subservices) ? body.subservices : [],
      providerId: uid,
      providerName: (body.providerName && typeof body.providerName === 'string') ? body.providerName : null,
      providerEmail: (body.providerEmail && typeof body.providerEmail === 'string') ? body.providerEmail : null,
      viewCount: 0,
      status: 'pending',
      createdAt: new Date(),
    };

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
