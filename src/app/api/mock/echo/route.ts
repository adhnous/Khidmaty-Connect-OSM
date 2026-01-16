import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickSafeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    const k = key.toLowerCase();
    const isSafe =
      k === 'accept' ||
      k === 'content-type' ||
      k === 'authorization' ||
      k === 'x-api-key' ||
      k === 'x-requested-with' ||
      k.startsWith('x-');
    if (!isSafe) continue;
    out[key] = value;
  }
  return out;
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) query[k] = v;

  const bodyText = await req.text().catch(() => '');

  return NextResponse.json({
    ok: true,
    method: req.method,
    query,
    headers: pickSafeHeaders(req.headers),
    bodyText,
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function PUT(req: Request) {
  return handle(req);
}

export async function PATCH(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}

