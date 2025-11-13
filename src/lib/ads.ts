import { db } from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

export type Ad = {
  id?: string;
  title?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  saleItemId?: string | null;
  active?: boolean;
  priority?: number | null;
};

export async function listActiveAds(take = 8): Promise<Ad[]> {
  const col = collection(db, 'ads');
  try {
    const qy = query(col, where('active', '==', true), orderBy('priority', 'desc'), limit(take));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ad[];
  } catch {
    const qy = query(col, where('active', '==', true), limit(take));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ad[];
  }
}

// Return promoted sale items chosen by owner via ads.saleItemId
export async function listPromotedSaleItems(take = 8): Promise<any[]> {
  const col = collection(db, 'ads');
  // Load a batch of active ads, then filter for those with saleItemId
  const adsSnap = await getDocs(query(col, where('active', '==', true), limit(Math.max(20, take * 2))));
  const ads = adsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((a) => !!a.saleItemId) as Array<Ad & { saleItemId: string }>;

  if (ads.length === 0) return [];

  // Sort by priority desc (missing becomes 0)
  ads.sort((a, b) => (Number(b.priority ?? 0) - Number(a.priority ?? 0)));

  // Take the first N unique saleItemIds
  const ids: string[] = [];
  for (const a of ads) {
    if (!ids.includes(a.saleItemId!)) ids.push(a.saleItemId!);
    if (ids.length >= take) break;
  }

  // Firestore 'in' supports up to 10 items; batch if necessary
  const results: any[] = [];
  const COL = 'sale_items';
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const ref = collection(db, COL);
    // @ts-ignore: in is supported at runtime
    const snap = await getDocs(query(ref, where('__name__', 'in', chunk)));
    results.push(...snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }

  // Preserve original priority order
  const map = new Map(results.map((r) => [r.id, r]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean);
  return ordered;
}
