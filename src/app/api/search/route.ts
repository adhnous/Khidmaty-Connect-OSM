import { NextResponse } from 'next/server';
import { searchKhidmaty } from '@/lib/searchKhidmaty';

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

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function safeErrorDetail(err: unknown): string {
  if (err instanceof Error && typeof err.message === 'string' && err.message.trim() !== '') {
    return err.message.slice(0, 200);
  }
  return 'Unexpected error';
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const q = cleanString(url.searchParams.get('q'));
    if (!q) {
      return withCors(
        NextResponse.json(
          { error: 'invalid_request', detail: 'Missing required query param: q' },
          { status: 400 },
        ),
      );
    }
    if (q.length > 120) {
      return withCors(
        NextResponse.json(
          { error: 'invalid_request', detail: 'q must be 1..120 characters' },
          { status: 400 },
        ),
      );
    }

    const typeRaw = cleanString(url.searchParams.get('type')).toLowerCase();
    const type: 'all' | 'services' | 'items' | 'providers' =
      typeRaw === 'services' || typeRaw === 'items' || typeRaw === 'providers' ? typeRaw : 'all';

    const city = cleanString(url.searchParams.get('city')) || undefined;
    const category = cleanString(url.searchParams.get('category')) || undefined;

    const page = clampInt(Number(url.searchParams.get('page') ?? 1), 1, 500);
    const limit = clampInt(Number(url.searchParams.get('limit') ?? 10), 1, 50);

    const { total, results } = await searchKhidmaty({ q, type, city, category, page, limit });

    return withCors(
      NextResponse.json({
        query: q,
        page,
        limit,
        total,
        results,
      }),
    );
  } catch (err) {
    console.error('[api/search] failed', err);
    return withCors(
      NextResponse.json(
        { error: 'internal_error', detail: safeErrorDetail(err) },
        { status: 500 },
      ),
    );
  }
}

