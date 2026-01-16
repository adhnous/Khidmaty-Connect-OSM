import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAINING_TOKEN = 'TRAINING_TOKEN';
const TRAINING_REFRESH_TOKEN = 'TRAINING_REFRESH_TOKEN';

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken.trim() : '';
  if (!refreshToken) return badRequest('Missing refreshToken');
  if (refreshToken !== TRAINING_REFRESH_TOKEN) return unauthorized('Invalid refresh token');

  return NextResponse.json({
    ok: true,
    tokenType: 'Bearer',
    accessToken: TRAINING_TOKEN,
    refreshToken: TRAINING_REFRESH_TOKEN,
    expiresInSeconds: 3600,
  });
}

