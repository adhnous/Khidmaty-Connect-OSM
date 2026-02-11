import { NextResponse } from 'next/server';
import { getSosAdmin } from '@/lib/firebase-admin-sos';
import { cleanString, requireAuthedSosUser, withCors } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  priority?: 'high';
  channelId?: string;
  data?: Record<string, any>;
};

function badRequest(detail: string) {
  return withCors(NextResponse.json({ error: 'invalid_request', detail }, { status: 400 }));
}

function unauthorized() {
  return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }));
}

function forbidden(detail: string) {
  return withCors(NextResponse.json({ error: 'forbidden', detail }, { status: 403 }));
}

function notFound(detail: string) {
  return withCors(NextResponse.json({ error: 'not_found', detail }, { status: 404 }));
}

function rateLimited(detail: string) {
  return withCors(NextResponse.json({ error: 'rate_limited', detail }, { status: 429 }));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  const n = Math.max(1, Math.trunc(size));
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n));
  return out;
}

async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return { ok: 0, errors: [] as any[] };

  const errors: any[] = [];
  let ok = 0;

  for (const batch of chunk(messages, 100)) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });

    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      errors.push({ type: 'http_error', status: res.status, body: json });
      continue;
    }

    const data = Array.isArray(json?.data) ? json.data : [];
    for (let i = 0; i < data.length; i += 1) {
      const r = data[i] as any;
      if (r?.status === 'ok') ok += 1;
      else errors.push({ type: 'expo_error', index: i, details: r });
    }
  }

  return { ok, errors };
}

async function sendFcmWebPush(messaging: any, input: { tokens: string[]; eventId: string }) {
  if (input.tokens.length === 0) return { ok: 0, errors: [] as any[] };

  const errors: any[] = [];
  let ok = 0;

  for (const batch of chunk(input.tokens, 500)) {
    const res = await messaging.sendEachForMulticast({
      tokens: batch,
      data: {
        type: 'sos',
        eventId: input.eventId,
        title: '🚨 SOS Alert',
        body: 'Tap to view location',
      },
      webpush: {
        headers: { Urgency: 'high' },
      },
    });

    ok += Number(res?.successCount ?? 0) || 0;
    const responses = Array.isArray(res?.responses) ? res.responses : [];
    for (let i = 0; i < responses.length; i += 1) {
      const r = responses[i] as any;
      if (r?.success) continue;
      const err = r?.error;
      const code = typeof err?.code === 'string' ? err.code : '';
      const msg = typeof err?.message === 'string' ? err.message : '';
      errors.push({ type: 'fcm_error', index: i, token: batch[i], code, message: msg });
    }
  }

  return { ok, errors };
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: Request) {
  try {
    const { auth, db, messaging, Timestamp } = getSosAdmin();

    let uid = '';
    try {
      uid = (await requireAuthedSosUser(req, auth)).uid;
    } catch {
      return unauthorized();
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const eventId = cleanString(body?.eventId);
    if (!eventId) return badRequest('eventId is required.');

    // Rate limit: max 10 sends per 30 minutes per sender.
    const now = Timestamp.now();
    const rateRef = db.collection('sos_rate').doc(uid);
    try {
      await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(rateRef);
        const windowStart = (snap.exists ? (snap.get('windowStart') as any) : null) || now;
        const countRaw = snap.exists ? Number(snap.get('count') ?? 0) : 0;
        const count = Number.isFinite(countRaw) ? Math.max(0, Math.trunc(countRaw)) : 0;

        const windowMs = 30 * 60 * 1000;
        const withinWindow = now.toMillis() - windowStart.toMillis() < windowMs;
        const nextWindowStart = withinWindow ? windowStart : now;
        const nextCount = withinWindow ? count + 1 : 1;

        if (withinWindow && count >= 10) throw new Error('rate_limited');

        tx.set(rateRef, { windowStart: nextWindowStart, count: nextCount }, { merge: true });
      });
    } catch (e) {
      const msg = cleanString((e as any)?.message);
      if (msg === 'rate_limited') return rateLimited('Rate limit exceeded. Try again later.');
      throw e;
    }

    const eventRef = db.collection('sos_events').doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) return notFound('SOS event not found.');

    const event = (eventSnap.data() || {}) as any;
    if (cleanString(event?.senderUid) !== uid) return forbidden('Not allowed to send this SOS.');

    const contactsSnap = await db
      .collection('trusted')
      .doc(uid)
      .collection('contacts')
      .where('status', '==', 'accepted')
      .get();

    const trustedUids = contactsSnap.docs.map((d: any) => cleanString(d.id)).filter(Boolean);
    if (trustedUids.length === 0) return withCors(NextResponse.json({ ok: true, sent: 0, recipients: 0 }));

    const tokenDocs = await Promise.all(
      trustedUids.map(async (trustedUid) => {
        const snap = await db.collection('devices').doc(trustedUid).collection('tokens').get();
        return snap.docs
          .map((d: any) => ({
            ref: d.ref,
            expoPushToken: cleanString(d.get('expoPushToken')),
            webPushToken: cleanString(d.get('webPushToken')),
          }))
          .filter((x: any) => !!x.expoPushToken || !!x.webPushToken);
      }),
    );

    const expoTokenToRefs = new Map<string, any[]>();
    const webTokenToRefs = new Map<string, any[]>();
    for (const list of tokenDocs) {
      for (const { expoPushToken, webPushToken, ref } of list) {
        if (expoPushToken) {
          const arr = expoTokenToRefs.get(expoPushToken) || [];
          arr.push(ref);
          expoTokenToRefs.set(expoPushToken, arr);
        }
        if (webPushToken) {
          const arr = webTokenToRefs.get(webPushToken) || [];
          arr.push(ref);
          webTokenToRefs.set(webPushToken, arr);
        }
      }
    }

    const expoTokens = Array.from(expoTokenToRefs.keys());
    const webTokens = Array.from(webTokenToRefs.keys());

    const expoMessages: ExpoPushMessage[] = expoTokens.map((t) => ({
      to: t,
      title: '🚨 SOS Alert',
      body: 'Tap to view location',
      sound: 'default',
      priority: 'high',
      channelId: 'sos',
      data: { type: 'sos', eventId },
    }));

    const expoRes = await sendExpoPush(expoMessages);
    const fcmRes = await sendFcmWebPush(messaging, { tokens: webTokens, eventId });

    // Cleanup invalid tokens.
    const invalidExpoTokens = new Set<string>();
    for (const e of expoRes.errors) {
      const r = e?.details;
      const err = typeof r?.details?.error === 'string' ? r.details.error : '';
      if (err === 'DeviceNotRegistered' || err === 'InvalidCredentials') {
        const idx = Number(e?.index ?? NaN);
        if (!Number.isFinite(idx) || idx < 0 || idx >= expoTokens.length) continue;
        invalidExpoTokens.add(expoTokens[idx]);
      }
    }

    const invalidWebTokens = new Set<string>();
    for (const e of fcmRes.errors) {
      const code = typeof e?.code === 'string' ? e.code : '';
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        const token = cleanString(e?.token);
        if (token) invalidWebTokens.add(token);
      }
    }

    if (invalidExpoTokens.size > 0) {
      const refs: any[] = [];
      for (const t of invalidExpoTokens) refs.push(...(expoTokenToRefs.get(t) || []));
      for (const delChunk of chunk(refs, 450)) {
        const batch = db.batch();
        for (const ref of delChunk) batch.delete(ref);
        await batch.commit();
      }
    }

    if (invalidWebTokens.size > 0) {
      const refs: any[] = [];
      for (const t of invalidWebTokens) refs.push(...(webTokenToRefs.get(t) || []));
      for (const delChunk of chunk(refs, 450)) {
        const batch = db.batch();
        for (const ref of delChunk) batch.delete(ref);
        await batch.commit();
      }
    }

    const sent = expoRes.ok + fcmRes.ok;
    const totalTokens = expoTokens.length + webTokens.length;

    return withCors(
      NextResponse.json({
        ok: true,
        sent,
        recipients: trustedUids.length,
        tokens: totalTokens,
        expoTokens: expoTokens.length,
        webTokens: webTokens.length,
        errors: expoRes.errors.length + fcmRes.errors.length,
      }),
    );
  } catch (err) {
    console.error('[api/sos/send] failed', err);
    return withCors(NextResponse.json({ error: 'internal_error' }, { status: 500 }));
  }
}
