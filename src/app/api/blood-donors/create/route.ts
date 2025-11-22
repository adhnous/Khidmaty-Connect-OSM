import { NextResponse } from 'next/server';
import { createBloodDonor, type BloodDonor } from '@/lib/blood-donors';
import { requireAuthedUser } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Payload = {
  name?: string;
  bloodType?: BloodDonor['bloodType'];
  city?: string;
  phone?: string;
  notes?: string;
  rare?: boolean;
  availability?: BloodDonor['availability'];
};

export async function POST(req: Request) {
  try {
    const authInfo = await requireAuthedUser(req);
    if (!authInfo.ok) {
      return NextResponse.json({ error: authInfo.error }, { status: authInfo.code });
    }

    let body: Payload | null = null;
    try {
      body = (await req.json()) as Payload;
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const name = String(body?.name || '').trim();
    const bloodType = (body?.bloodType as BloodDonor['bloodType']) || 'other';

    if (!name) {
      return NextResponse.json({ error: 'missing_name' }, { status: 400 });
    }

    const id = await createBloodDonor({
      name,
      bloodType,
      city: body?.city?.trim() || undefined,
      phone: body?.phone?.trim() || undefined,
      notes: body?.notes?.trim() || undefined,
      rare: !!body?.rare,
      availability: body?.availability || 'available',
      uploaderId: authInfo.uid,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    console.error('blood-donors create error', err);
    return NextResponse.json(
      { error: 'failed_to_create_blood_donor' },
      { status: 500 },
    );
  }
}

