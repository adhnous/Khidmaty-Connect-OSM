import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAINING_API_KEY = 'LIBYA123';
const QUERY_NAME = 'api_key';

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Missing or invalid API key' }, { status: 401 });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const key = (url.searchParams.get(QUERY_NAME) || '').trim();
  if (key !== TRAINING_API_KEY) return unauthorized();

  return NextResponse.json({
    ok: true,
    message: 'API key accepted',
    accepted: { in: 'query', name: QUERY_NAME, value: TRAINING_API_KEY },
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

