import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'missing_token' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);

    const { auth, db, messaging, FieldValue } = await getAdmin();
    const decoded = await auth.verifyIdToken(idToken);
    const requesterId = decoded.uid as string;

    let body: any = {};
    try { body = await req.json(); } catch {}
    const serviceId = String(body?.serviceId || '').trim();
    const note = (typeof body?.note === 'string' ? body.note : '').trim().slice(0, 500);

    if (!serviceId) {
      return NextResponse.json({ error: 'invalid_serviceId' }, { status: 400 });
    }

    const serviceSnap = await db.collection('services').doc(serviceId).get();
    if (!serviceSnap.exists) {
      return NextResponse.json({ error: 'service_not_found' }, { status: 404 });
    }
    const service = serviceSnap.data() || {};
    const providerId = String(service.providerId || '').trim();
    if (!providerId) {
      return NextResponse.json({ error: 'invalid_provider' }, { status: 400 });
    }
    if (providerId === requesterId) {
      return NextResponse.json({ error: 'cannot_request_own_service' }, { status: 400 });
    }
    // Respect provider setting: disable in-app requests if turned off
    if ((service as any)?.acceptRequests === false) {
      return NextResponse.json({ error: 'requests_disabled' }, { status: 403 });
    }

    // Requester profile snapshot (for provider context)
    const requesterSnap = await db.collection('users').doc(requesterId).get();
    const requester = requesterSnap.exists ? requesterSnap.data() || {} : {};

    // Create request document with helpful snapshots
    const reqDocRef = await db.collection('requests').add({
      serviceId,
      serviceTitle: String(service?.title || ''),
      providerId,
      requesterId,
      requesterName: String(requester?.displayName || requester?.email || requesterId),
      requesterEmail: requester?.email || null,
      requesterPhone: requester?.phone || null,
      requesterWhatsapp: requester?.whatsapp || null,
      note: note || null,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Push to provider tokens
    const userSnap = await db.collection('users').doc(providerId).get();
    const tokensMap = userSnap.exists ? (userSnap.get('fcmTokens') || {}) : {};
    const tokens = Object.keys(tokensMap || {}).filter(Boolean);

    let successCount = 0, failureCount = 0;
    if (tokens.length) {
      const title = 'Khidmaty';
      const who = String((requester?.displayName || requester?.email || '') || '').slice(0, 40);
      const noteSnippet = note ? ` — "${note.slice(0, 80)}${note.length > 80 ? '…' : ''}"` : '';
      const bodyText = service?.title
        ? `New request${who ? ` from ${who}` : ''}: ${String(service.title).slice(0, 60)}${noteSnippet}`
        : `You have a new request${who ? ` from ${who}` : ''}${noteSnippet}`;
      const url = `/services/${serviceId}`;
      const res = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: bodyText,
        },
        webpush: {
          fcmOptions: { link: url },
          notification: { icon: '/favicon.ico', badge: '/favicon.ico' },
        },
        data: {
          title,
          body: bodyText,
          url,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requestId: reqDocRef.id,
          serviceId,
          requesterName: String((requester?.displayName || requester?.email || '') || ''),
          note: note || '',
          whatsapp: requester?.whatsapp || '',
          phone: requester?.phone || '',
        },
      });
      successCount = res.successCount;
      failureCount = res.failureCount;
    } else {
      return NextResponse.json({ ok: true, requestId: reqDocRef.id, info: 'no_tokens' });
    }

    return NextResponse.json({ ok: true, requestId: reqDocRef.id, successCount, failureCount });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 });
  }
}
