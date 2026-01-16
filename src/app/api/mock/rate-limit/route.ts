import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maybeRateLimit() {
  if (Math.random() < 0.3) {
    return NextResponse.json({ ok: false, error: 'Rate limited' }, { status: 429 });
  }
  return NextResponse.json({ ok: true, message: 'OK' });
}

export async function GET() {
  return maybeRateLimit();
}

export async function POST() {
  return maybeRateLimit();
}

export async function PUT() {
  return maybeRateLimit();
}

export async function PATCH() {
  return maybeRateLimit();
}

export async function DELETE() {
  return maybeRateLimit();
}

