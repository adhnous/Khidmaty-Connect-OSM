import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Check',
};

function withCors<T extends Response>(res: T): T {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

function cleanString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

async function fetchRowsFromUrl(rawUrl: string): Promise<any[] | null> {
  const url = cleanString(rawUrl);
  if (!url) return null;

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  try {
    let db: any;
    try {
      const admin = await getAdmin();
      db = admin.db;
    } catch {
      return withCors(
        NextResponse.json({ error: 'admin_unavailable' }, { status: 503 }),
      );
    }

    const snap = await db.collection('settings').doc('tripoli_medical_directory').get();
    if (!snap.exists) return withCors(NextResponse.json([]));

    const data = snap.data() || {};

    const jsonString = cleanString(data.json);
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) return withCors(NextResponse.json(parsed));
      } catch {
        // ignore parse errors; fall through to other formats
      }
    }

    const rows = Array.isArray(data.rows) ? data.rows : null;
    if (rows && rows.length > 0) return withCors(NextResponse.json(rows));

    const url = cleanString(data.url) || cleanString(data.jsonUrl);
    if (url) {
      const fromUrl = await fetchRowsFromUrl(url);
      if (fromUrl && fromUrl.length > 0) return withCors(NextResponse.json(fromUrl));
    }

    return withCors(NextResponse.json([]));
  } catch (err) {
    console.error('[api/osm/tripoli/medical] failed', err);
    return withCors(
      NextResponse.json({ error: 'internal_error' }, { status: 500 }),
    );
  }
}

