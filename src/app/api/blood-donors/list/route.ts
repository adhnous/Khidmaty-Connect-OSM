import { NextResponse } from 'next/server';
import { listBloodDonors } from '@/lib/blood-donors';

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

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city') || undefined;
    const bloodType = (url.searchParams.get('bloodType') ||
      undefined) as
      | 'A+'
      | 'A-'
      | 'B+'
      | 'B-'
      | 'AB+'
      | 'AB-'
      | 'O+'
      | 'O-'
      | 'other'
      | undefined;
    const rareOnly = url.searchParams.get('rareOnly') === 'true';

    const items = await listBloodDonors({
      city,
      bloodType,
      rareOnly,
    });

    return withCors(NextResponse.json({ items }));
  } catch (err: any) {
    console.error('blood-donors list error', err);
    return withCors(
      NextResponse.json(
        { error: 'failed_to_list_blood_donors' },
        { status: 500 },
      ),
    );
  }
}
