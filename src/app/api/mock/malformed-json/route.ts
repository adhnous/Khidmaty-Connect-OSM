import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle() {
  return new NextResponse('{ "ok": true, "note": "This is intentionally broken JSON"', {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}

export async function PUT() {
  return handle();
}

export async function PATCH() {
  return handle();
}

export async function DELETE() {
  return handle();
}

