import { NextResponse } from 'next/server';
import { deleteMockTodo, getMockTodoById, patchMockTodo, replaceMockTodo } from '@/app/api/mock/todos/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const todo = getMockTodoById(id);
  if (!todo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, todo });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const cityEn = typeof body?.cityEn === 'string' ? body.cityEn.trim() : '';
  const cityAr = typeof body?.cityAr === 'string' ? body.cityAr.trim() : '';
  const done = typeof body?.done === 'boolean' ? body.done : undefined;

  if (!title || !cityEn || !cityAr || typeof done !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload. Expected {title,cityEn,cityAr,done:boolean}.' },
      { status: 400 }
    );
  }

  const updated = replaceMockTodo(id, { title, cityEn, cityAr, done });
  if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, todo: updated });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;
  const patch: any = {};
  if (typeof body?.title === 'string') patch.title = body.title.trim();
  if (typeof body?.cityEn === 'string') patch.cityEn = body.cityEn.trim();
  if (typeof body?.cityAr === 'string') patch.cityAr = body.cityAr.trim();
  if (typeof body?.done === 'boolean') patch.done = body.done;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ ok: false, error: 'Empty patch' }, { status: 400 });
  }

  const updated = patchMockTodo(id, patch);
  if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, todo: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = deleteMockTodo(id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
