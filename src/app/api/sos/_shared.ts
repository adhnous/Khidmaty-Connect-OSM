import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Check',
};

export function withCors<T extends Response>(res: T): T {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export function cleanString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

export function cleanEmail(input: unknown): string {
  return cleanString(input).toLowerCase();
}

export function normalizePhone(input: unknown): string | null {
  const raw = cleanString(input);
  if (!raw) return null;

  const hasPlus = raw.startsWith('+');
  const has00 = raw.startsWith('00');

  const digits = raw.replace(/[^\d]+/g, '');
  if (!digits) return null;

  let e164 = '';
  if (hasPlus) e164 = `+${digits}`;
  else if (has00) e164 = `+${digits.slice(2)}`;
  else return null;

  if (!/^\+\d{8,15}$/.test(e164)) return null;
  return e164;
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const v = authHeader.trim();
  if (!v.toLowerCase().startsWith('bearer ')) return null;
  const token = v.slice(7).trim();
  return token || null;
}

export async function requireAuthedSosUser(req: Request, sosAuth: any): Promise<{ uid: string }> {
  const token = getBearerToken(req);
  if (!token) throw new Error('missing_token');
  const decoded = await sosAuth.verifyIdToken(token);
  const uid = cleanString(decoded?.uid);
  if (!uid) throw new Error('invalid_token');
  return { uid };
}

