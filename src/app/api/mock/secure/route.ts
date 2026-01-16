import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAINING_TOKEN = 'TRAINING_TOKEN';

function isAuthorized(req: Request): boolean {
  const authz = (req.headers.get('authorization') || '').trim();
  const m = authz.match(/^Bearer\s+(.+)$/i);
  return m?.[1] === TRAINING_TOKEN;
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

function authorized() {
  return NextResponse.json({ ok: true, message: 'Authorized' });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return authorized();
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return authorized();
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return authorized();
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return authorized();
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return authorized();
}
