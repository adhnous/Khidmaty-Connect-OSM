import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_REDIRECT_PREFIX = '/api/mock/';
const ALLOWED_STATUSES = new Set([301, 302, 307, 308]);

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = String(url.searchParams.get('to') || '/api/mock/users').trim();
  const status = Number(url.searchParams.get('status') ?? 302);

  if (!to.startsWith(ALLOWED_REDIRECT_PREFIX)) {
    return badRequest(`Redirect target must start with ${ALLOWED_REDIRECT_PREFIX}`);
  }
  const redirectUrl = new URL(to, url.origin);

  return NextResponse.redirect(redirectUrl, ALLOWED_STATUSES.has(status) ? status : 302);
}

