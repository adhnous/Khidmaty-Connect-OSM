import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DonationItem = {
  id: string;
  title: string;
  city?: string;
  bloodType?: string;
  responseCount: number;
};

function toDonationItem(id: string, data: any): DonationItem {
  const title =
    String(data?.title || data?.name || data?.personName || data?.campaignName || '').trim();
  const city = data?.city ? String(data.city) : undefined;
  const bloodType = data?.bloodType ? String(data.bloodType) : undefined;
  const responseCount = Number(data?.responseCount ?? 0);
  return { id, title, city, bloodType, responseCount };
}

function sortByResponsesDesc(items: DonationItem[]) {
  return [...items].sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0));
}

export async function GET() {
  try {
    const { db } = await getAdmin();

    // Prefer "campaign-like" collections if they exist, then fall back to `blood_donors`.
    const collections = ['bloodDonations', 'donationCampaigns', 'blood_donors'] as const;

    for (const colName of collections) {
      const snap = await db
        .collection(colName)
        .orderBy('responseCount', 'desc')
        .limit(10)
        .get();

      if (snap.empty) continue;

      const items = snap.docs
        .map((d) => toDonationItem(d.id, d.data()))
        .filter((x) => x.title.length > 0);

      return Response.json({
        items: sortByResponsesDesc(items).slice(0, 10),
        source: colName,
      });
    }

    return Response.json({ items: [], source: null });
  } catch (err: any) {
    console.error('blood donors top error', err);
    return Response.json(
      { error: 'failed_to_list_top_blood_donation' },
      { status: 500 },
    );
  }
}
