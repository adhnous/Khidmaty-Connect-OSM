import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TextMode = 'plain' | 'html';

function toMode(input: string | null): TextMode {
  const v = String(input || '').toLowerCase();
  return v === 'html' ? 'html' : 'plain';
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const mode = toMode(url.searchParams.get('mode'));

  if (mode === 'html') {
    const body = `<!doctype html><html><head><meta charset="utf-8"/><title>Mini Postman</title></head><body><h1>Mini Postman HTML</h1><p>This is an HTML response for practice.</p></body></html>`;
    return new NextResponse(body, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const city = String(url.searchParams.get('city') || 'Tripoli').trim() || 'Tripoli';
  const body = `Hello from ${city}. This is a text/plain response for practice.\n`;
  return new NextResponse(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

