import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional protection for your bot endpoint:
// - Set `BOT_API_KEY` in production (Vercel/hosting env vars).
// - Send the same value as header `x-bot-key` from n8n.
function requireBotKeyIfConfigured(req: Request): NextResponse | null {
  const expected = (process.env.BOT_API_KEY || '').trim();
  if (!expected) return null;
  const got = (req.headers.get('x-bot-key') || '').trim();
  if (got && got === expected) return null;
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

type SearchType = 'services' | 'sales';

type BotSearchInput = {
  type: SearchType;
  q: string;
  city?: string;
  category?: string; // services only
  condition?: string; // sales only
  tradeEnabled?: boolean; // sales only
  limit: number;
};

type SearchResult = {
  id: string;
  title: string;
  city: string;
  url: string;
  imageUrl: string | null;
  [key: string]: unknown;
};

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function cleanString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function parseBool(input: unknown): boolean | undefined {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1 ? true : input === 0 ? false : undefined;
  if (typeof input !== 'string') return undefined;
  const v = input.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'n') return false;
  return undefined;
}

function isAllCities(city: string): boolean {
  const v = city.trim().toLowerCase();
  return v === '' || v === 'all cities';
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter((t) => t.length > 1);
}

function textIncludesScore(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  let score = 0;
  for (const tok of tokens) {
    if (tok && text.includes(tok)) score += 1;
  }
  return score;
}

function toMillis(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') return Number(v.toMillis()) || 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v?._seconds === 'number') {
    const s = Number(v._seconds) || 0;
    const ns = Number(v._nanoseconds) || 0;
    return s * 1000 + Math.floor(ns / 1e6);
  }
  return 0;
}

function getOrigin(req: Request): string {
  const proto =
    (req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol') || '').split(',')[0].trim();
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
  if (proto && host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function getFirstImageUrl(images: any): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  const url = typeof first?.url === 'string' ? first.url.trim() : '';
  return url || null;
}

async function listApprovedServicesCandidates(opts: {
  db: any;
  city?: string;
  category?: string;
  take: number;
}): Promise<any[]> {
  const { db, city, category, take } = opts;
  const col = db.collection('services');

  const useCity = !!city && !isAllCities(city);
  const useCategory = !!category;

  const fetchLimit = clampInt(Math.max(take * 10, 60), 20, 200);

  const withFilters = (q: any) => {
    let next = q.where('status', '==', 'approved');
    if (useCity) next = next.where('city', '==', city);
    if (useCategory) next = next.where('category', '==', category);
    return next;
  };

  const base = withFilters(col);

  try {
    const snap = await base.orderBy('createdAt', 'desc').limit(fetchLimit).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
  } catch {
    // Fallback 1: drop orderBy, sort client-side
    try {
      const snap = await base.limit(fetchLimit).get();
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      return rows.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
    } catch {
      // Fallback 2: only status filter, then filter in memory
      const simplerTake = clampInt(Math.max(fetchLimit, 120), 40, 250);
      let rows: any[] = [];
      try {
        const snap = await col.where('status', '==', 'approved').orderBy('createdAt', 'desc').limit(simplerTake).get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      } catch {
        const snap = await col.where('status', '==', 'approved').limit(simplerTake).get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
      }

      return rows.filter((r) => {
        if (useCity && String(r?.city || '') !== city) return false;
        if (useCategory && String(r?.category || '') !== category) return false;
        return true;
      });
    }
  }
}

async function listApprovedSalesCandidates(opts: {
  db: any;
  city?: string;
  condition?: string;
  tradeEnabled?: boolean;
  take: number;
}): Promise<any[]> {
  const { db, city, condition, tradeEnabled, take } = opts;
  const col = db.collection('sale_items');

  const useCity = !!city && !isAllCities(city);
  const useCondition = !!condition;
  const useTradeEnabled = typeof tradeEnabled === 'boolean';

  const fetchLimit = clampInt(Math.max(take * 10, 60), 20, 200);

  const withFilters = (q: any) => {
    let next = q.where('status', '==', 'approved');
    if (useCity) next = next.where('city', '==', city);
    if (useCondition) next = next.where('condition', '==', condition);
    if (useTradeEnabled) next = next.where('trade.enabled', '==', tradeEnabled);
    return next;
  };

  const base = withFilters(col);

  try {
    const snap = await base.orderBy('createdAt', 'desc').limit(fetchLimit).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
  } catch {
    // Fallback 1: drop orderBy, sort client-side
    try {
      const snap = await base.limit(fetchLimit).get();
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      return rows.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
    } catch {
      // Fallback 2: only status filter, then filter in memory
      const simplerTake = clampInt(Math.max(fetchLimit, 120), 40, 250);
      let rows: any[] = [];
      try {
        const snap = await col.where('status', '==', 'approved').orderBy('createdAt', 'desc').limit(simplerTake).get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      } catch {
        const snap = await col.where('status', '==', 'approved').limit(simplerTake).get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
      }

      return rows.filter((r) => {
        if (useCity && String(r?.city || '') !== city) return false;
        if (useCondition && String(r?.condition || '') !== condition) return false;
        if (useTradeEnabled && Boolean(r?.trade?.enabled) !== tradeEnabled) return false;
        return true;
      });
    }
  }
}

function serviceToSearchText(s: any): string {
  const parts = [
    cleanString(s?.title),
    cleanString(s?.description),
    cleanString(s?.category),
    cleanString(s?.city),
    cleanString(s?.area),
    cleanString(s?.providerName),
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

function saleToSearchText(s: any): string {
  const tags =
    Array.isArray(s?.tags) && s.tags.length > 0 ? s.tags.map((t: any) => cleanString(t)).filter(Boolean).join(' ') : '';
  const tradeFor = cleanString(s?.trade?.tradeFor);
  const parts = [
    cleanString(s?.title),
    cleanString(s?.description),
    cleanString(s?.city),
    tags,
    tradeFor,
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

function parseInputFromUrl(url: URL): Partial<BotSearchInput> {
  const sp = url.searchParams;
  const typeRaw = cleanString(sp.get('type'));
  const type = typeRaw === 'sales' ? 'sales' : typeRaw === 'services' ? 'services' : undefined;

  const q = cleanString(sp.get('q'));
  const city = cleanString(sp.get('city')) || undefined;
  const category = cleanString(sp.get('category')) || undefined;
  const condition = cleanString(sp.get('condition')) || undefined;
  const tradeEnabled = parseBool(sp.get('tradeEnabled'));
  const limit = sp.has('limit') ? Number(sp.get('limit')) : undefined;

  return { type, q, city, category, condition, tradeEnabled, limit: limit as any };
}

function parseInputFromBody(body: any): Partial<BotSearchInput> {
  const typeRaw = cleanString(body?.type);
  const type = typeRaw === 'sales' ? 'sales' : typeRaw === 'services' ? 'services' : undefined;
  const q = cleanString(body?.q);
  const city = cleanString(body?.city) || undefined;
  const category = cleanString(body?.category) || undefined;
  const condition = cleanString(body?.condition) || undefined;
  const tradeEnabled = parseBool(body?.tradeEnabled);
  const limit = body?.limit != null ? Number(body.limit) : undefined;
  return { type, q, city, category, condition, tradeEnabled, limit: limit as any };
}

function normalizeInput(input: Partial<BotSearchInput>): BotSearchInput {
  const type: SearchType = input.type === 'sales' ? 'sales' : 'services';
  const q = cleanString(input.q);
  const city = cleanString(input.city) || undefined;
  const category = cleanString(input.category) || undefined;
  const condition = cleanString(input.condition) || undefined;
  const tradeEnabled = parseBool((input as any).tradeEnabled);
  const limit = clampInt(Number(input.limit ?? 6), 1, 12);
  return { type, q, city, category, condition, tradeEnabled, limit };
}

async function handleSearch(req: Request, input: BotSearchInput) {
  let db: any;
  try {
    const admin = await getAdmin();
    db = admin.db;
  } catch {
    return NextResponse.json({ ok: false, error: 'admin_unavailable' }, { status: 503 });
  }

  const origin = getOrigin(req);
  const tokens = tokenize(input.q);

  if (input.type === 'services') {
    const candidates = await listApprovedServicesCandidates({
      db,
      city: input.city,
      category: input.category,
      take: input.limit,
    });

    const ranked = candidates
      .map((s) => {
        const text = serviceToSearchText(s);
        const score = textIncludesScore(text, tokens);
        return { s, score, createdAtMs: toMillis(s?.createdAt) };
      })
      .filter((x) => (tokens.length > 0 ? x.score > 0 : true))
      .sort((a, b) => (b.score - a.score) || (b.createdAtMs - a.createdAtMs));

    const results: SearchResult[] = ranked.slice(0, input.limit).map(({ s }) => {
      const id = String(s?.id || '');
      const title = cleanString(s?.title);
      const city = cleanString(s?.city);
      const url = `${origin}/services/${encodeURIComponent(id)}`;
      return {
        id,
        title,
        city,
        category: cleanString(s?.category) || null,
        area: cleanString(s?.area) || null,
        price: typeof s?.price === 'number' ? s.price : Number(s?.price ?? 0) || 0,
        priceMode: cleanString(s?.priceMode) || null,
        providerName: (typeof s?.providerName === 'string' ? s.providerName : null) as any,
        url,
        imageUrl: getFirstImageUrl(s?.images),
      };
    });

    return NextResponse.json({
      ok: true,
      type: input.type,
      q: input.q,
      city: input.city || '',
      results,
    });
  }

  const candidates = await listApprovedSalesCandidates({
    db,
    city: input.city,
    condition: input.condition,
    tradeEnabled: input.tradeEnabled,
    take: input.limit,
  });

  const ranked = candidates
    .map((s) => {
      const text = saleToSearchText(s);
      const score = textIncludesScore(text, tokens);
      return { s, score, createdAtMs: toMillis(s?.createdAt) };
    })
    .filter((x) => (tokens.length > 0 ? x.score > 0 : true))
    .sort((a, b) => (b.score - a.score) || (b.createdAtMs - a.createdAtMs));

  const results: SearchResult[] = ranked.slice(0, input.limit).map(({ s }) => {
    const id = String(s?.id || '');
    const title = cleanString(s?.title);
    const city = cleanString(s?.city);
    const url = `${origin}/sales/${encodeURIComponent(id)}`;
    const tags =
      Array.isArray(s?.tags) && s.tags.length > 0
        ? s.tags.map((t: any) => cleanString(t)).filter(Boolean).slice(0, 8)
        : undefined;
    return {
      id,
      title,
      city,
      condition: cleanString(s?.condition) || null,
      price: typeof s?.price === 'number' ? s.price : Number(s?.price ?? 0) || 0,
      tradeEnabled: Boolean(s?.trade?.enabled),
      tradeFor: cleanString(s?.trade?.tradeFor) || null,
      tags,
      url,
      imageUrl: getFirstImageUrl(s?.images),
    };
  });

  return NextResponse.json({
    ok: true,
    type: input.type,
    q: input.q,
    city: input.city || '',
    results,
  });
}

export async function GET(req: Request) {
  const blocked = requireBotKeyIfConfigured(req);
  if (blocked) return blocked;

  const url = new URL(req.url);
  const input = normalizeInput(parseInputFromUrl(url));
  return handleSearch(req, input);
}

export async function POST(req: Request) {
  const blocked = requireBotKeyIfConfigured(req);
  if (blocked) return blocked;

  const url = new URL(req.url);
  const fromUrl = parseInputFromUrl(url);
  const body = (await req.json().catch(() => null)) as any;
  const fromBody = parseInputFromBody(body);
  const input = normalizeInput({ ...fromUrl, ...fromBody });
  return handleSearch(req, input);
}
