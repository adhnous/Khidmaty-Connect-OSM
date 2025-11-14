import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';
import { deleteCloudinaryImage } from '@/lib/cloudinary-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin/owner-only endpoint to hard-delete a service and best-effort
 * clean up any associated Cloudinary images.
 *
 * This route is intended to be called from the owner-console or a secure
 * internal tool, not from the public client app.
 */
export async function POST(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.code });
  }

  const body = await req.json().catch(() => ({} as any));
  const id = (body?.id || body?.serviceId || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'id_required' }, { status: 400 });
  }

  const { db } = await getAdmin();

  // Load the service document
  const ref = db.collection('services').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const data = snap.data() || {};

  // Best-effort Cloudinary cleanup for images
  try {
    const images = Array.isArray((data as any).images) ? (data as any).images : [];
    for (const img of images) {
      const url = String((img && img.url) || '');
      const publicId = String((img && img.publicId) || '');
      if (publicId) {
        await deleteCloudinaryImage(publicId);
      } else if (url) {
        await deleteCloudinaryImage(url);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[admin-delete] Cloudinary cleanup failed', err);
  }

  // Delete the service document
  await ref.delete();

  // Mark any pending deletion requests for this service as resolved
  try {
    const reqSnap = await db
      .collection('service_deletion_requests')
      .where('serviceId', '==', id)
      .where('status', '==', 'pending')
      .limit(50)
      .get();

    const batch = db.batch();
    reqSnap.forEach((d: any) => {
      batch.update(d.ref, {
        status: 'approved',
        resolvedAt: new Date(),
        resolvedBy: authz.uid,
      });
    });
    if (!reqSnap.empty) {
      await batch.commit();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[admin-delete] failed to update deletion requests', err);
  }

  return NextResponse.json({ ok: true });
}

