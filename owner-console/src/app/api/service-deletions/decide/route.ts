import { NextResponse } from 'next/server';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/service-deletions/decide { id, action: 'approve' | 'reject' }
export async function POST(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.code });

  const body = await req.json().catch(() => ({}));
  const id = (body?.id || '').trim();
  const action = (body?.action || '').trim();
  if (!id || !['approve','reject'].includes(action)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { db } = await getAdmin();
  const reqRef = db.collection('service_deletion_requests').doc(id);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const data = reqSnap.data() || {};
  const serviceId = data.serviceId as string | undefined;
  if (!serviceId) return NextResponse.json({ error: 'no_service' }, { status: 400 });

  const svcRef = db.collection('services').doc(serviceId);
  const now = new Date();

  if (action === 'approve') {
    // Delete the service doc if exists
    const svcSnap = await svcRef.get();
    if (svcSnap.exists) {
      await svcRef.delete();
    }
    await reqRef.set({ status: 'approved', approvedAt: now, approvedBy: authz.uid }, { merge: true });
    return NextResponse.json({ ok: true, id, action: 'approved' });
  } else {
    // Reject: revert service status and remove pendingDelete flag
    const priorStatus = data.priorStatus || 'approved';
    await svcRef.set({ status: priorStatus, pendingDelete: false }, { merge: true });
    await reqRef.set({ status: 'rejected', approvedAt: now, approvedBy: authz.uid }, { merge: true });
    return NextResponse.json({ ok: true, id, action: 'rejected' });
  }
}
