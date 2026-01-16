import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function toFormat(input: string | null): 'json' | 'text' | 'empty' {
  const v = String(input || '').toLowerCase();
  if (v === 'text') return 'text';
  if (v === 'empty') return 'empty';
  return 'json';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = clampInt(Number(url.searchParams.get('code') ?? 200), 100, 599);
  const format = toFormat(url.searchParams.get('format'));
  const message = String(url.searchParams.get('message') || '').trim();

  if (code === 204 || format === 'empty') {
    return new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }

  if (format === 'text') {
    return new NextResponse(message || `Status ${code} from /api/mock/status`, {
      status: code,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    {
      ok: code >= 200 && code < 300,
      status: code,
      message: message || `Status ${code} from /api/mock/status`,
      hint: 'Use ?code=418 or ?code=500&message=... to practice status handling.',
    },
    { status: code, headers: { 'cache-control': 'no-store' } }
  );
}

