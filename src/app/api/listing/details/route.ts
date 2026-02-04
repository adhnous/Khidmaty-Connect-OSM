import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Check',
};

function withCors<T extends Response>(res: T): T {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

function cleanString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function safeErrorDetail(err: unknown): string {
  if (err instanceof Error && typeof err.message === 'string' && err.message.trim() !== '') {
    return err.message.slice(0, 200);
  }
  return 'Unexpected error';
}

function toNumberOrNull(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function getFirstImageUrl(images: any): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return cleanString(first) || null;
  const url = typeof first?.url === 'string' ? first.url.trim() : '';
  return url || null;
}

function extractLatLon(data: any): { lat: number | null; lon: number | null } {
  const lat = toNumberOrNull(
    data?.lat ??
      data?.latitude ??
      data?.location?.lat ??
      data?.location?.latitude,
  );
  const lon = toNumberOrNull(
    data?.lon ??
      data?.lng ??
      data?.longitude ??
      data?.location?.lon ??
      data?.location?.lng ??
      data?.location?.longitude,
  );
  return { lat, lon };
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const typeRaw = cleanString(url.searchParams.get('type')).toLowerCase();
    const type: 'service' | 'item' | null =
      typeRaw === 'service' ? 'service' : typeRaw === 'item' ? 'item' : null;

    const id = cleanString(url.searchParams.get('id'));
    if (!type || !id) {
      return withCors(
        NextResponse.json(
          { error: 'invalid_request', detail: 'Expected query params: type=service|item and id' },
          { status: 400 },
        ),
      );
    }
    if (id.length > 120) {
      return withCors(
        NextResponse.json(
          { error: 'invalid_request', detail: 'id must be 1..120 characters' },
          { status: 400 },
        ),
      );
    }

    let db: any;
    try {
      const admin = await getAdmin();
      db = admin.db;
    } catch {
      return withCors(
        NextResponse.json({ error: 'admin_unavailable' }, { status: 503 }),
      );
    }

    const collectionName = type === 'item' ? 'sale_items' : 'services';
    const snap = await db.collection(collectionName).doc(id).get();
    if (!snap.exists) {
      return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }));
    }

    const data = snap.data() || {};
    const status = cleanString(data.status);
    if (status !== 'approved') {
      return withCors(NextResponse.json({ error: 'not_found' }, { status: 404 }));
    }

    const description = cleanString(data.description) || null;
    const thumb =
      getFirstImageUrl(data.images) ||
      cleanString(data.thumb) ||
      cleanString(data.imageUrl) ||
      cleanString(data.photoURL) ||
      null;

    const { lat, lon } = extractLatLon(data);

    return withCors(
      NextResponse.json({
        ok: true,
        id,
        type,
        description,
        thumb,
        lat,
        lon,
      }),
    );
  } catch (err) {
    console.error('[api/listing/details] failed', err);
    return withCors(
      NextResponse.json(
        { error: 'internal_error', detail: safeErrorDetail(err) },
        { status: 500 },
      ),
    );
  }
}

