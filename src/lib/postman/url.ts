import type { KeyValueRow, PostmanAuth } from '@/lib/postman/firestore';

function appendRows(searchParams: URLSearchParams, rows: KeyValueRow[]) {
  for (const row of rows) {
    if (!row?.enabled) continue;
    const key = String(row.key || '').trim();
    if (!key) continue;
    const value = String(row.value ?? '');
    searchParams.append(key, value);
  }
}

export function buildUrlWithParamsAndAuth(
  rawUrl: string,
  params: KeyValueRow[],
  auth: PostmanAuth
): string {
  const input = String(rawUrl || '').trim();
  const isAbsolute = /^https?:\/\//i.test(input);

  const u = isAbsolute ? new URL(input) : new URL(input, 'https://example.com');
  appendRows(u.searchParams, params);

  if (auth.type === 'apikey' && auth.in === 'query') {
    const key = String(auth.keyName || '').trim();
    const value = String(auth.keyValue ?? '');
    if (key) u.searchParams.append(key, value);
  }

  return isAbsolute ? u.toString() : `${u.pathname}${u.search}${u.hash}`;
}

