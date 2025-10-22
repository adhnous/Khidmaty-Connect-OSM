import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireAuthedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Require Firebase-authenticated user
  const auth = await requireAuthedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.code });
  }

  const METABASE_SITE_URL = process.env.METABASE_SITE_URL;
  const METABASE_SECRET = process.env.METABASE_JWT_SECRET;
  const DASHBOARD_ID = process.env.METABASE_DASHBOARD_ID;

  if (!METABASE_SITE_URL || !METABASE_SECRET || !DASHBOARD_ID) {
    return NextResponse.json(
      { error: 'metabase_env_missing' },
      { status: 500 }
    );
  }

  // Compose per-user params to lock the embed. Make sure your Metabase dashboard filters
  // use matching parameter names (e.g., uid, email).
  const params: Record<string, string | number | boolean> = {
    uid: auth.uid,
  };
  if (auth.email) params.email = auth.email;

  const payload = {
    resource: { dashboard: Number(DASHBOARD_ID) },
    params,
    exp: Math.round(Date.now() / 1000) + 60 * 10, // 10 minutes
  } as const;

  const token = jwt.sign(payload, METABASE_SECRET);

  const theme = (process.env.METABASE_EMBED_THEME || 'night').toLowerCase();
  const bordered = String(process.env.METABASE_EMBED_BORDERED || 'false').toLowerCase() === 'true';
  const titled = String(process.env.METABASE_EMBED_TITLED || 'false').toLowerCase() === 'true';

  const url = `${METABASE_SITE_URL.replace(/\/$/, '')}/embed/dashboard/${token}` +
    `#theme=${encodeURIComponent(theme)}&bordered=${bordered}&titled=${titled}`;

  return NextResponse.json({ url });
}
