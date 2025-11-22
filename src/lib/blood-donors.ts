import 'server-only';
import { getAdmin } from '@/lib/firebase-admin';

export type BloodDonor = {
  id: string;
  name: string;
  bloodType:
    | 'A+'
    | 'A-'
    | 'B+'
    | 'B-'
    | 'AB+'
    | 'AB-'
    | 'O+'
    | 'O-'
    | 'other';
  city?: string;
  phone?: string;
  notes?: string;
  rare?: boolean;
  availability?: 'available' | 'maybe' | 'unavailable';
  uploaderId?: string;
  createdAt?: Date | unknown;
};

export type BloodDonorListFilters = {
  city?: string;
  bloodType?: BloodDonor['bloodType'];
  rareOnly?: boolean;
};

export type CreateBloodDonorInput = Omit<BloodDonor, 'id' | 'createdAt'>;

function applyFilters(
  rows: BloodDonor[],
  filters: BloodDonorListFilters,
): BloodDonor[] {
  const { city, bloodType, rareOnly } = filters;
  let out = [...rows];

  if (city) {
    const needle = city.toLowerCase();
    out = out.filter((r) =>
      String(r.city || '').toLowerCase().includes(needle),
    );
  }

  if (bloodType && bloodType !== 'other') {
    out = out.filter((r) => r.bloodType === bloodType);
  }

  if (rareOnly) {
    out = out.filter((r) => !!r.rare);
  }

  return out;
}

export async function listBloodDonors(
  filters: BloodDonorListFilters = {},
): Promise<BloodDonor[]> {
  try {
    const { db } = await getAdmin();
    const col = db.collection('blood_donors');
    const snap = await col.orderBy('createdAt', 'desc').limit(80).get();
    const rows: BloodDonor[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: String(data.name || ''),
        bloodType: (data.bloodType as BloodDonor['bloodType']) || 'other',
        city: data.city,
        phone: data.phone,
        notes: data.notes,
        rare: !!data.rare,
        availability: data.availability,
        uploaderId: data.uploaderId,
        createdAt: data.createdAt,
      };
    });

    return applyFilters(rows, filters);
  } catch (err) {
    console.error('listBloodDonors error', err);
    return [];
  }
}

export async function createBloodDonor(
  input: CreateBloodDonorInput,
): Promise<string> {
  const { db, FieldValue } = await getAdmin();
  const col = db.collection('blood_donors');

  const payload: any = {
    name: String(input.name || '').trim(),
    bloodType: input.bloodType || 'other',
    city: input.city ? String(input.city) : undefined,
    phone: input.phone ? String(input.phone) : undefined,
    notes: input.notes ? String(input.notes) : undefined,
    rare: !!input.rare,
    availability: input.availability || 'available',
    uploaderId: input.uploaderId || undefined,
    createdAt:
      typeof FieldValue?.serverTimestamp === 'function'
        ? FieldValue.serverTimestamp()
        : new Date(),
  };

  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== null),
  );

  const ref = await col.add(clean);
  return ref.id;
}

