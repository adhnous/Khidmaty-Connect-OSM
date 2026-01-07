import type { Service, ServiceImage, ServicePriceMode, SubService } from '@/lib/service-types';

function asNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t : undefined;
}

function asFiniteNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function normalizePriceMode(v: unknown): ServicePriceMode | undefined {
  const mode = String(v || '').toLowerCase();
  if (mode === 'firm' || mode === 'negotiable' || mode === 'call' || mode === 'hidden') return mode;
  return undefined;
}

export function normalizeServiceImages(input: unknown): ServiceImage[] {
  if (!Array.isArray(input)) return [];
  const out: ServiceImage[] = [];
  for (const raw of input) {
    const url = asNonEmptyString((raw as any)?.url);
    if (!url) continue;
    const hint = asNonEmptyString((raw as any)?.hint);
    const publicId = asNonEmptyString((raw as any)?.publicId);
    out.push({
      url,
      ...(hint ? { hint } : {}),
      ...(publicId ? { publicId } : {}),
    });
  }
  return out;
}

export function normalizeSubservices(input: unknown): SubService[] {
  if (!Array.isArray(input)) return [];
  const out: SubService[] = [];
  for (const raw of input) {
    const id = asNonEmptyString((raw as any)?.id);
    const title = asNonEmptyString((raw as any)?.title);
    const price = asFiniteNumber((raw as any)?.price) ?? 0;
    if (!id || !title) continue;
    const unit = asNonEmptyString((raw as any)?.unit);
    const description = asNonEmptyString((raw as any)?.description);
    out.push({
      id,
      title,
      price,
      ...(unit ? { unit } : {}),
      ...(description ? { description } : {}),
    });
  }
  return out;
}

export function normalizeVideoUrls(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const urls = input
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean);
  return urls.length ? urls : undefined;
}

type ServiceCreateCtx = {
  providerId: string;
  providerName?: string | null;
  providerEmail?: string | null;
  createdAt: unknown;
};

export function buildServiceCreateDoc(input: unknown, ctx: ServiceCreateCtx): Omit<Service, 'id'> {
  const body: any = (input && typeof input === 'object') ? input : {};

  const title = asNonEmptyString(body.title) ?? '';
  const description = asNonEmptyString(body.description) ?? '';
  const price = asFiniteNumber(body.price) ?? 0;
  const category = asNonEmptyString(body.category) ?? '';
  const city = asNonEmptyString(body.city) ?? 'Tripoli';
  const area = typeof body.area === 'string' ? body.area : '';

  const doc: Omit<Service, 'id'> = {
    title,
    description,
    price,
    priceMode: normalizePriceMode(body.priceMode) ?? 'firm',
    showPriceInContact: typeof body.showPriceInContact === 'boolean' ? body.showPriceInContact : false,
    acceptRequests: typeof body.acceptRequests === 'boolean' ? body.acceptRequests : true,
    category,
    city,
    area,
    availabilityNote: typeof body.availabilityNote === 'string' ? body.availabilityNote : '',
    lat: asFiniteNumber(body.lat),
    lng: asFiniteNumber(body.lng),
    mapUrl: asNonEmptyString(body.mapUrl),
    images: normalizeServiceImages(body.images),
    contactPhone: asNonEmptyString(body.contactPhone),
    contactWhatsapp: asNonEmptyString(body.contactWhatsapp),
    videoUrl: asNonEmptyString(body.videoUrl),
    videoUrls: normalizeVideoUrls(body.videoUrls),
    facebookUrl: asNonEmptyString(body.facebookUrl),
    telegramUrl: asNonEmptyString(body.telegramUrl),
    subservices: normalizeSubservices(body.subservices),
    providerId: ctx.providerId,
    providerName: (ctx.providerName ?? null),
    providerEmail: (ctx.providerEmail ?? null),
    viewCount: 0,
    status: 'pending',
    createdAt: ctx.createdAt,
  };

  return doc;
}

const UPDATE_BLOCKLIST = new Set([
  'id',
  'providerId',
  'providerName',
  'providerEmail',
  'status',
  'createdAt',
  'viewCount',
  'pendingDelete',
  // Wizard-only fields that should never persist
  'location',
  'youtubeUrl',
]);

export function buildServiceUpdatePatch(input: unknown): Partial<Service> {
  const body: any = (input && typeof input === 'object') ? input : {};
  const out: any = {};

  for (const [k, v] of Object.entries(body)) {
    if (UPDATE_BLOCKLIST.has(k)) continue;
    out[k] = v;
  }

  if ('priceMode' in out) out.priceMode = normalizePriceMode(out.priceMode) ?? undefined;
  if ('showPriceInContact' in out) out.showPriceInContact = typeof out.showPriceInContact === 'boolean' ? out.showPriceInContact : undefined;
  if ('acceptRequests' in out) out.acceptRequests = typeof out.acceptRequests === 'boolean' ? out.acceptRequests : undefined;

  if ('lat' in out) out.lat = asFiniteNumber(out.lat);
  if ('lng' in out) out.lng = asFiniteNumber(out.lng);

  if ('mapUrl' in out) out.mapUrl = asNonEmptyString(out.mapUrl);
  if ('contactPhone' in out) out.contactPhone = asNonEmptyString(out.contactPhone);
  if ('contactWhatsapp' in out) out.contactWhatsapp = asNonEmptyString(out.contactWhatsapp);
  if ('videoUrl' in out) out.videoUrl = asNonEmptyString(out.videoUrl);
  if ('facebookUrl' in out) out.facebookUrl = asNonEmptyString(out.facebookUrl);
  if ('telegramUrl' in out) out.telegramUrl = asNonEmptyString(out.telegramUrl);

  if ('images' in out) out.images = normalizeServiceImages(out.images);
  if ('subservices' in out) out.subservices = normalizeSubservices(out.subservices);
  if ('videoUrls' in out) out.videoUrls = normalizeVideoUrls(out.videoUrls);

  return out as Partial<Service>;
}
