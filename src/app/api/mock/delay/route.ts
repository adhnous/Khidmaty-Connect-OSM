import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const ms = clampInt(Number(url.searchParams.get('ms') ?? 600), 0, 5000);

  const start = Date.now();
  await sleep(ms);
  const end = Date.now();

  return NextResponse.json({
    ok: true,
    requestedDelayMs: ms,
    actualDelayMs: Math.max(0, end - start),
    nowIso: new Date().toISOString(),
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

