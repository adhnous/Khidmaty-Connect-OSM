import { NextResponse } from 'next/server';
import { createMockTodo, listMockTodos } from '@/app/api/mock/todos/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get('city') || undefined;
  const q = url.searchParams.get('q') || undefined;
  const take = url.searchParams.has('take') ? Number(url.searchParams.get('take')) : undefined;
  const done = url.searchParams.has('done')
    ? url.searchParams.get('done') === 'true'
    : undefined;

  const res = listMockTodos({ city, q, done, take });
  return NextResponse.json({ ok: true, todos: res.todos, total: res.total, take: res.take });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const cityEn = typeof body?.cityEn === 'string' ? body.cityEn.trim() : '';
  const cityAr = typeof body?.cityAr === 'string' ? body.cityAr.trim() : '';
  const done = typeof body?.done === 'boolean' ? body.done : false;

  if (!title || !cityEn || !cityAr) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload. Expected {title,cityEn,cityAr,done?}.' },
      { status: 400 }
    );
  }
  if (title.length > 140) {
    return NextResponse.json({ ok: false, error: 'title too long' }, { status: 400 });
  }

  const created = createMockTodo({ title, cityEn, cityAr, done });
  return NextResponse.json({ ok: true, todo: created }, { status: 201 });
}

