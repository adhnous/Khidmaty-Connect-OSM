import { NextResponse } from 'next/server';
import { getMockServiceById } from '@/app/api/mock/services/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const svc = getMockServiceById(id);
  if (!svc) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, service: svc });
}
