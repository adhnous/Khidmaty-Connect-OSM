import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function yyyymmddDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

type Agg = { views: number; ctas: number; messages: number };

/**
 * Public endpoint: returns top approved services using server-side stats aggregation.
 * This avoids exposing `stats_daily` to clients while still enabling ranking.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = clampInt(Number(url.searchParams.get('days') ?? 7), 1, 30);
  const take = clampInt(Number(url.searchParams.get('take') ?? 10), 1, 50);

  const wViews = Number(url.searchParams.get('wViews') ?? 1);
  const wCtas = Number(url.searchParams.get('wCtas') ?? 3);
  const wMessages = Number(url.searchParams.get('wMessages') ?? 5);

  let db: any;
  try {
    const admin = await getAdmin();
    db = admin.db;
  } catch {
    return NextResponse.json({ ok: true, skipped: 'admin_unavailable', days, take, services: [] });
  }

  const dayKeys = Array.from({ length: days }, (_, i) => yyyymmddDaysAgo(i));

  const snaps = await Promise.all(
    dayKeys.map((k) => db.collection('stats_daily').where('yyyymmdd', '==', k).limit(5000).get())
  );

  const byService = new Map<string, Agg>();
  for (const snap of snaps) {
    snap.forEach((d: any) => {
      const data = d.data() || {};
      const serviceId = String(data.serviceId || '');
      if (!serviceId) return;
      const prev = byService.get(serviceId) || { views: 0, ctas: 0, messages: 0 };
      byService.set(serviceId, {
        views: prev.views + Number(data.views || 0),
        ctas: prev.ctas + Number(data.ctas || 0),
        messages: prev.messages + Number(data.messages || 0),
      });
    });
  }

  const scored = Array.from(byService.entries())
    .map(([serviceId, a]) => {
      const score = a.views * wViews + a.ctas * wCtas + a.messages * wMessages;
      return { serviceId, ...a, score };
    })
    .sort((a, b) => (b.score - a.score) || (b.views - a.views))
    .slice(0, take);

  if (scored.length === 0) return NextResponse.json({ ok: true, days, take, services: [] });

  const refs = scored.map((r) => db.collection('services').doc(r.serviceId));
  const svcSnaps = await db.getAll(...refs);

  const svcById = new Map<string, any>();
  for (const s of svcSnaps) {
    if (!s.exists) continue;
    const data = s.data() || {};
    if (String(data.status || '') !== 'approved') continue;
    svcById.set(s.id, { id: s.id, ...data });
  }

  const services = scored
    .map((r) => {
      const svc = svcById.get(r.serviceId);
      if (!svc) return null;
      return {
        ...svc,
        stats: { views: r.views, ctas: r.ctas, messages: r.messages, days },
        score: r.score,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ ok: true, days, take, services });
}

