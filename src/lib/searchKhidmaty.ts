import 'server-only';

import { getAdmin } from '@/lib/firebase-admin';
import { libyanCities } from '@/lib/cities';
import { categories } from '@/lib/categories';

export type SearchParams = {
  q: string;
  type?: 'all' | 'services' | 'items' | 'providers';
  city?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type SearchResult = {
  id: string;
  title: string;
  type: 'service' | 'item' | 'provider';
  city: string | null;
  category: string | null;
  priceFrom: number | null;
  rating: number | null;
  thumb: string | null;
};

const MAX_LIMIT = 50;
const MAX_PAGE = 500;

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function cleanString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function isAllCities(city: string): boolean {
  const v = city.trim().toLowerCase();
  return v === '' || v === 'all cities' || v === 'all_cities';
}

const cityAliasMap: Record<string, string> = {
  "طرابلس": "Tripoli",
  "طرابلس الكبرى": "Tripoli",
  "بنغازي": "Benghazi",
  "مصراتة": "Misrata",
  "مصراتة الحمراء": "Misrata",
  "سبها": "Sabha",
  "سبها المدينة": "Sabha",
  "غريان": "Gharyan",
  "طرهونة": "Tarhuna",
  "زليتن": "Zliten",
  "زوارة": "Zuwara",
};

const categoryAliasMap: Record<string, string> = {
  "خدمات منزلية": "Home Services",
  "خدمات تقنية": "IT & Computer Repair",
  "تدريب": "Education",
  "تعليم": "Education",
  "قانونية": "Legal Services",
  "محاسبة": "Accounting & Tax",
  "ديكور": "Interior Design",
  "سباكة": "Plumbing",
  "كهرباء": "Electrical",
  "ميكانيكا": "Automotive",
  "تنظيف": "Cleaning",
  "توصيل": "Transport & Delivery",
  "مقاولات": "Construction",
  "بناء": "Construction",
  "صيانة": "Home Services",
};

function normalizeAliasKey(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function resolveCityAlias(raw: string): string | undefined {
  const key = normalizeAliasKey(raw);
  return key ? cityAliasMap[key] : undefined;
}

function resolveCategoryAlias(raw: string): string | undefined {
  const key = normalizeAliasKey(raw);
  return key ? categoryAliasMap[key] : undefined;
}

function normalizeCity(input: string | undefined): string | undefined {
  const raw = cleanString(input);
  if (!raw || isAllCities(raw)) return undefined;

  const needle = raw.toLowerCase();

  const exact = libyanCities.find(
    (c) => c.value.toLowerCase() === needle || c.ar.toLowerCase() === needle,
  );
  if (exact) return exact.value;

  const partial = libyanCities.find((c) => {
    const en = c.value.toLowerCase();
    const ar = c.ar.toLowerCase();
    return needle.includes(en) || needle.includes(ar);
  });
  if (partial) return partial.value;

  const alias = resolveCityAlias(raw);
  if (alias) return alias;

  return raw;
}

function normalizeCategory(input: string | undefined): string | undefined {
  const raw = cleanString(input);
  if (!raw) return undefined;

  const needle = raw.toLowerCase();
  const exact = categories.find((c) => c.toLowerCase() === needle);
  return exact ?? raw;
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

function getFirstImageUrl(images: any): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') {
    const u = first.trim();
    return u || null;
  }
  const url = typeof first?.url === 'string' ? first.url.trim() : '';
  if (url) return url;
  const displayUrl = typeof first?.displayUrl === 'string' ? first.displayUrl.trim() : '';
  if (displayUrl) return displayUrl;
  const src = typeof first?.src === 'string' ? first.src.trim() : '';
  return src || null;
}

function toNumberOrNull(v: any): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function getItemCategoryFromTags(s: any): string | null {
  const tags = Array.isArray(s?.tags) ? s.tags : [];
  if (tags.length === 0) return null;
  const first = cleanString(tags[0]);
  return first || null;
}

// Keep these filters aligned with the existing Khidmaty UI (services + sales pages).
function filterServicesByQuery(rows: any[], q: string): any[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((s: any) => {
    const title = String(s?.title || '').toLowerCase();
    const desc = String(s?.description || '').toLowerCase();
    const cat = String(s?.category || '').toLowerCase();
    const cityText = String(s?.city || '').toLowerCase();
    const areaText = String(s?.area || '').toLowerCase();
    return (
      title.includes(needle) ||
      desc.includes(needle) ||
      cat.includes(needle) ||
      cityText.includes(needle) ||
      areaText.includes(needle)
    );
  });
}

function filterItemsByQuery(rows: any[], q: string): any[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;

  const tokens = needle
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  return rows.filter((r: any) => {
    const t = String(r?.title || '').toLowerCase();
    const d = String(r?.description || '').toLowerCase();
    const tf = String(r?.trade?.tradeFor || '').toLowerCase();
    const c = String(r?.city || '').toLowerCase();
    const tags: string[] = Array.isArray(r?.tags) ? (r.tags as string[]) : [];

    const inText = tokens.some((tok) => t.includes(tok) || d.includes(tok) || tf.includes(tok) || c.includes(tok));

    const inTags = tags.some((x) => {
      const v = String(x || '').toLowerCase();
      return tokens.some((tok) => v.includes(tok));
    });

    return inText || inTags;
  });
}

function filterProvidersByQuery(rows: any[], q: string): any[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((p: any) => {
    const name = String(p?.displayName || '').toLowerCase();
    const email = String(p?.email || '').toLowerCase();
    const cityText = String(p?.city || '').toLowerCase();
    return name.includes(needle) || email.includes(needle) || cityText.includes(needle);
  });
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

  const fetchLimit = clampInt(Math.max(take * 10, 80), 20, 800);

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
      const simplerTake = clampInt(Math.max(fetchLimit, 160), 40, 1000);
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

async function listApprovedItemsCandidates(opts: {
  db: any;
  city?: string;
  take: number;
}): Promise<any[]> {
  const { db, city, take } = opts;
  const col = db.collection('sale_items');

  const useCity = !!city && !isAllCities(city);

  const fetchLimit = clampInt(Math.max(take * 10, 80), 20, 800);

  const withFilters = (q: any) => {
    let next = q.where('status', '==', 'approved');
    if (useCity) next = next.where('city', '==', city);
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
      const simplerTake = clampInt(Math.max(fetchLimit, 160), 40, 1000);
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
        return true;
      });
    }
  }
}

async function listProviderCandidates(opts: {
  db: any;
  city?: string;
  take: number;
}): Promise<any[]> {
  const { db, city, take } = opts;
  const col = db.collection('users');

  const useCity = !!city && !isAllCities(city);

  const fetchLimit = clampInt(Math.max(take * 10, 80), 20, 600);

  let base: any = col.where('role', '==', 'provider');
  if (useCity) base = base.where('city', '==', city);

  try {
    const snap = await base.orderBy('createdAt', 'desc').limit(fetchLimit).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
  } catch {
    // Fallback: drop orderBy, sort client-side if possible
    try {
      const snap = await base.limit(fetchLimit).get();
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      return rows.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
    } catch {
      // Last resort: just role filter then filter city in memory
      const snap = await col.where('role', '==', 'provider').limit(fetchLimit).get();
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      const filtered = useCity ? rows.filter((r: any) => String(r?.city || '') === city) : rows;
      return filtered.sort((a: any, b: any) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
    }
  }
}

function toServiceResult(s: any): SearchResult {
  const id = String(s?.id || '');
  const title = cleanString(s?.title) || 'Untitled service';
  return {
    id,
    title,
    type: 'service',
    city: cleanString(s?.city) || null,
    category: cleanString(s?.category) || null,
    priceFrom: toNumberOrNull(s?.price),
    rating: null,
    thumb: getFirstImageUrl(s?.images) || cleanString(s?.thumb) || cleanString(s?.imageUrl) || null,
  };
}

function toItemResult(s: any): SearchResult {
  const id = String(s?.id || '');
  const title = cleanString(s?.title) || 'Untitled item';
  return {
    id,
    title,
    type: 'item',
    city: cleanString(s?.city) || null,
    category: getItemCategoryFromTags(s),
    priceFrom: toNumberOrNull(s?.price),
    rating: toNumberOrNull(s?.rating),
    thumb: getFirstImageUrl(s?.images) || cleanString(s?.thumb) || cleanString(s?.imageUrl) || null,
  };
}

function toProviderResult(p: any): SearchResult {
  const id = String(p?.id || '');
  const title =
    cleanString(p?.displayName) ||
    cleanString(p?.email) ||
    'Provider';
  return {
    id,
    title,
    type: 'provider',
    city: cleanString(p?.city) || null,
    category: null,
    priceFrom: null,
    rating: null,
    thumb: cleanString(p?.photoURL) || null,
  };
}

export async function searchKhidmaty(params: SearchParams): Promise<{ total: number; results: SearchResult[] }> {
  const q = cleanString(params.q);
  const type = params.type ?? 'all';
  const city = normalizeCity(cleanString(params.city) || undefined);
  const category = normalizeCategory(cleanString(params.category) || undefined);
  const page = clampInt(Number(params.page ?? 1), 1, MAX_PAGE);
  const limit = clampInt(Number(params.limit ?? 10), 1, MAX_LIMIT);

  const take = page * limit;

  const { db } = await getAdmin();

  const includeServices = type === 'all' || type === 'services';
  const includeItems = type === 'all' || type === 'items';
  const includeProviders = type === 'all' || type === 'providers';

  const [servicesCandidates, itemsCandidates, providersCandidates] = await Promise.all([
    includeServices ? listApprovedServicesCandidates({ db, city, category, take }) : Promise.resolve([]),
    includeItems ? listApprovedItemsCandidates({ db, city, take }) : Promise.resolve([]),
    includeProviders ? listProviderCandidates({ db, city, take }) : Promise.resolve([]),
  ]);

  const services = includeServices ? filterServicesByQuery(servicesCandidates, q).map(toServiceResult) : [];
  const items = includeItems ? filterItemsByQuery(itemsCandidates, q).map(toItemResult) : [];
  const providers = includeProviders ? filterProvidersByQuery(providersCandidates, q).map(toProviderResult) : [];

  const combined = [...services, ...items, ...providers];
  const total = combined.length;
  const start = (page - 1) * limit;
  const results = combined.slice(start, start + limit);

  return { total, results };
}
