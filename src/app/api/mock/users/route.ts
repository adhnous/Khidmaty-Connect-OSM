import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USERS = [
  { id: 'u_1', name: 'أحمد الزنتاني' },
  { id: 'u_2', name: 'فاطمة الترهوني' },
  { id: 'u_3', name: 'محمد المصراتي' },
  { id: 'u_4', name: 'خديجة الورفلي' },
  { id: 'u_5', name: 'سالم بن عمر' },
];

export async function GET() {
  return NextResponse.json({ ok: true, users: USERS });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const name = typeof (body as any)?.name === 'string' ? (body as any).name.trim() : '';
  const email = typeof (body as any)?.email === 'string' ? (body as any).email.trim() : '';

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload. Expected {name:string,email:string}.' },
      { status: 400 }
    );
  }

  const user = { id: `u_${Math.random().toString(16).slice(2, 10)}`, name, email };
  return NextResponse.json({ ok: true, user }, { status: 201 });
}

