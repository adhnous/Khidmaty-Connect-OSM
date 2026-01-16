import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAINING_PASSWORD = 'password123';
const TRAINING_TOKEN = 'TRAINING_TOKEN';
const TRAINING_REFRESH_TOKEN = 'TRAINING_REFRESH_TOKEN';
const TRAINING_EMAIL = 'student@khidmaty.ly';

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email) return badRequest('Missing email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('Invalid email');
  if (!password) return badRequest('Missing password');
  if (email.toLowerCase() !== TRAINING_EMAIL) return unauthorized('Invalid credentials');
  if (password !== TRAINING_PASSWORD) return unauthorized('Invalid credentials');

  const user = {
    id: 'student_1',
    name: 'عائشة',
    email: TRAINING_EMAIL,
    cityEn: 'Tripoli',
    cityAr: 'طرابلس',
    role: 'student',
  };

  return NextResponse.json({
    ok: true,
    tokenType: 'Bearer',
    accessToken: TRAINING_TOKEN,
    refreshToken: TRAINING_REFRESH_TOKEN,
    expiresInSeconds: 3600,
    user,
  });
}
