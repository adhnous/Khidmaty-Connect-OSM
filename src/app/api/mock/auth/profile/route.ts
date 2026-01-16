import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRAINING_TOKEN = 'TRAINING_TOKEN';
const EXPIRED_TOKEN = 'EXPIRED_TOKEN';

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

function parseBearerToken(req: Request): string | null {
  const authz = (req.headers.get('authorization') || '').trim();
  const m = authz.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ? m[1].trim() : null;
}

export async function GET(req: Request) {
  const token = parseBearerToken(req);
  if (!token) return unauthorized('Missing bearer token');
  if (token === EXPIRED_TOKEN) return unauthorized('Token expired');
  if (token !== TRAINING_TOKEN) return unauthorized('Invalid token');

  return NextResponse.json({
    ok: true,
    user: {
      id: 'student_1',
      name: 'عائشة',
      email: 'student@khidmaty.ly',
      cityEn: 'Tripoli',
      cityAr: 'طرابلس',
      role: 'student',
    },
    scopes: ['read:profile', 'read:services'],
  });
}

