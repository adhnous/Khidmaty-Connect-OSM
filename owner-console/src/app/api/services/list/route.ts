import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  // AuthN + AuthZ via ID token in Authorization header
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected';

  const { db } = await getAdmin();
  let q = db.collection('services').where('status', '==', status).limit(100);
  const snap = await q.get();
  const rows = snap.docs.map((d: any) => {
    const data = d.data() || {};
    const images = Array.isArray(data.images) ? data.images : [];
    const createdAtISO = data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null;
    return {
      id: d.id,
      title: data.title || '',
      providerId: data.providerId || '',
      status: data.status || null,
      createdAt: createdAtISO,
      imageUrl: images[0]?.url || null,
      images: images.map((it: any) => ({ url: it?.url || null })).filter((it: any) => !!it.url).slice(0, 12),
      price: typeof data.price === 'number' ? data.price : null,
      category: data.category || null,
      city: data.city || null,
      area: data.area || null,
      contactPhone: data.contactPhone || null,
      contactWhatsapp: data.contactWhatsapp || null,
      description: data.description || null,
      videoUrl: data.videoUrl || null,
    } as const;
  });

  // Sort newest first without requiring a composite index
  rows.sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return NextResponse.json({ rows });
}
