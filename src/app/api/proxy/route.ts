import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type AllowedMethod = (typeof ALLOWED_METHODS)[number];

const ALLOWED_RELATIVE_PREFIXES = ['/api/mock/'] as const;
const ALLOWED_EXTERNAL_HOSTS = new Set(['api.github.com', 'dorar.net']);

const BLOCKED_HEADERS = new Set([
  'host',
  'connection',
  'upgrade',
  'transfer-encoding',
]);

const MAX_BODY_BYTES = 100 * 1024;

function hostNotAllowed() {
  return NextResponse.json({ ok: false, error: 'Host not allowed' }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function methodNotAllowed() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}

function isAllowedMethod(method: string): method is AllowedMethod {
  return (ALLOWED_METHODS as readonly string[]).includes(method);
}

function isPrivateIpLiteral(hostname: string): boolean {
  const host = hostname.split('%')[0] || hostname; // strip IPv6 zone id if present
  const ver = isIP(host);
  if (ver === 4) {
    const parts = host.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return true;
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (ver === 6) {
    const h = host.toLowerCase();
    if (h === '::' || h === '::1') return true;
    if (h.startsWith('fe80:')) return true; // link-local
    if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique local (fc00::/7)
    if (h.startsWith('::ffff:')) {
      const v4 = h.slice('::ffff:'.length);
      return isPrivateIpLiteral(v4);
    }
    return false;
  }
  return false;
}

function sanitizeHeaders(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== 'object') return out;

  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = String(rawKey || '').trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (BLOCKED_HEADERS.has(lower)) continue;
    if (lower.includes('\r') || lower.includes('\n')) continue;

    if (rawValue === undefined || rawValue === null) continue;
    const value = String(rawValue);
    if (value.includes('\r') || value.includes('\n')) continue;

    out[key] = value;
  }

  return out;
}

function resolveAndValidateTargetUrl(req: NextRequest, rawUrl: string): URL | null | 'host_not_allowed' {
  const input = rawUrl.trim();
  if (!input) return null;

  if (input.startsWith('/')) {
    const allowed = ALLOWED_RELATIVE_PREFIXES.some((p) => input.startsWith(p));
    if (!allowed) return 'host_not_allowed';
    return new URL(input, req.nextUrl.origin);
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return 'host_not_allowed';
  if (parsed.username || parsed.password) return 'host_not_allowed';
  if (parsed.port && parsed.port !== '443') return 'host_not_allowed';

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost') return 'host_not_allowed';
  if (isPrivateIpLiteral(hostname)) return 'host_not_allowed';

  if (!ALLOWED_EXTERNAL_HOSTS.has(hostname)) return 'host_not_allowed';

  return parsed;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as any;
  const methodRaw = String(body?.method || '').toUpperCase();
  const url = String(body?.url || '');
  const headers = sanitizeHeaders(body?.headers);
  const bodyText = typeof body?.bodyText === 'string' ? body.bodyText : undefined;

  if (!isAllowedMethod(methodRaw)) {
    return badRequest(`Invalid method. Allowed: ${ALLOWED_METHODS.join(', ')}`);
  }
  const method = methodRaw;

  const target = resolveAndValidateTargetUrl(req, url);
  if (target === 'host_not_allowed') return hostNotAllowed();
  if (!target) return badRequest('Invalid url');

  let fetchBody: string | undefined;
  const methodAllowsBody = method !== 'GET';
  if (methodAllowsBody && bodyText !== undefined && bodyText !== '') {
    const bytes = new TextEncoder().encode(bodyText).byteLength;
    if (bytes > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'Body too large' }, { status: 413 });
    }
    fetchBody = bodyText;
  }

  const start = Date.now();
  try {
    const resp = await fetch(target.toString(), {
      method,
      headers,
      body: fetchBody,
      redirect: 'manual',
      cache: 'no-store',
    });
    const end = Date.now();

    const respBodyText = await resp.text().catch(() => '');
    const respHeaders: Record<string, string> = {};
    for (const [k, v] of resp.headers.entries()) respHeaders[k] = v;

    const ct = resp.headers.get('content-type') || '';
    const isJson = ct.toLowerCase().includes('application/json') || ct.toLowerCase().includes('+json');

    return NextResponse.json({
      ok: true,
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
      bodyText: respBodyText,
      timeMs: Math.max(0, end - start),
      isJson,
    });
  } catch (e) {
    const end = Date.now();
    const message = e instanceof Error ? e.message : 'Fetch failed';
    return NextResponse.json(
      { ok: false, error: message, timeMs: Math.max(0, end - start) },
      { status: 502 }
    );
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
