import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT_LIMIT_WINDOW_MS = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000); // 1 hour
const CONTACT_LIMIT_MAX = Number(process.env.CONTACT_RATE_LIMIT_MAX || 5); // per window, per IP hash

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return String(xff).split(',')[0]?.trim() || '0.0.0.0';
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return String(realIp).trim();
  return (req as any).ip || '0.0.0.0';
}

function hashKey(raw: string): string {
  const salt = process.env.CONTACT_RATE_LIMIT_SALT || 'khidmaty-contact';
  return createHash('sha256').update(`${salt}:${raw}`).digest('hex');
}

function isValidEmail(email: string): boolean {
  // Basic validation only (avoid heavy deps).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    const name = String(body?.name || '').trim().slice(0, 80);
    const email = String(body?.email || '').trim().slice(0, 200);
    const message = String(body?.message || '').trim().slice(0, 2000);

    if (!name || !email || !message || !isValidEmail(email)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const { db, FieldValue, auth } = await getAdmin();

    // Basic rate-limit to reduce spam (per-IP hash, per window).
    const ip = getClientIp(req);
    const ipHash = hashKey(ip);
    const nowMs = Date.now();

    const limitRef = db.collection('rate_limits').doc(`contact_${ipHash}`);
    const limit = await db.runTransaction(async (t: any) => {
      const snap = await t.get(limitRef);
      const data = (snap.exists ? (snap.data() || {}) : {}) as any;
      const windowStartMs = typeof data.windowStartMs === 'number' ? data.windowStartMs : 0;
      const count = typeof data.count === 'number' ? data.count : 0;

      const freshWindow = !windowStartMs || (nowMs - windowStartMs) > CONTACT_LIMIT_WINDOW_MS;
      const start = freshWindow ? nowMs : windowStartMs;
      const nextCount = freshWindow ? 1 : (count + 1);

      if (!freshWindow && count >= CONTACT_LIMIT_MAX) {
        const retryAfterMs = Math.max(1, CONTACT_LIMIT_WINDOW_MS - (nowMs - windowStartMs));
        return { ok: false as const, retryAfterMs };
      }

      t.set(limitRef, {
        windowStartMs: start,
        count: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return { ok: true as const, retryAfterMs: 0 };
    });

    if (!limit.ok) {
      const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    // If the caller is signed in, attach uid for easier moderation (optional).
    let uid: string | null = null;
    try {
      const authz = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      const m = authz.match(/^Bearer\s+(.+)$/i);
      if (m?.[1]) {
        const decoded = await auth.verifyIdToken(m[1], true);
        uid = decoded.uid || null;
      }
    } catch {
      // ignore
    }

    const ref = db.collection('contact_messages').doc();
    await ref.set({
      name,
      email,
      message,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new',
      uid,
      ipHash,
      origin: req.headers.get('origin') || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
