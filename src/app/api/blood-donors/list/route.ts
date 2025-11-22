import { NextResponse } from 'next/server';
import { listBloodDonors } from '@/lib/blood-donors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('blood-donors list error', err);
    return NextResponse.json(
      { error: 'failed_to_list_blood_donors' },
      { status: 500 },
    );
  }
}

