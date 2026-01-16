const ALLOWED_RELATIVE_PREFIX = '/api/mock/';
const ALLOWED_EXTERNAL_HOSTS = new Set(['api.github.com', 'dorar.net']);

export type UrlValidationResult =
  | { ok: true; normalized: string; kind: 'relative' | 'absolute' }
  | { ok: false; error: string };

export function validatePracticeUrl(input: string): UrlValidationResult {
  const raw = String(input || '').trim();
  if (!raw) return { ok: false, error: 'URL is required' };

  if (raw.startsWith('/')) {
    if (!raw.startsWith(ALLOWED_RELATIVE_PREFIX)) {
      return { ok: false, error: `Only paths under ${ALLOWED_RELATIVE_PREFIX} are allowed` };
    }
    return { ok: true, normalized: raw, kind: 'relative' };
  }

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (u.protocol !== 'https:') return { ok: false, error: 'Only https:// URLs are allowed' };
  if (u.username || u.password) return { ok: false, error: 'Credentials in URL are not allowed' };

  const host = u.hostname.toLowerCase();
  if (!ALLOWED_EXTERNAL_HOSTS.has(host)) return { ok: false, error: 'Host not allowed' };

  return { ok: true, normalized: u.toString(), kind: 'absolute' };
}

export type JsonValidationResult =
  | { ok: true; value?: unknown }
  | { ok: false; error: string };

export function validateJson(text: string): JsonValidationResult {
  const raw = String(text ?? '');
  if (!raw.trim()) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

export function formatJson(text: string): { ok: true; formatted: string } | { ok: false; error: string } {
  const res = validateJson(text);
  if (!res.ok) return { ok: false, error: res.error };
  if (res.value === undefined) return { ok: true, formatted: '' };
  return { ok: true, formatted: JSON.stringify(res.value, null, 2) };
}
