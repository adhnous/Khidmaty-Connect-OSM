import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { SaleItemForm } from '@/lib/schemas-sale';

const COL = 'sale_items';

function deepStripUndefined<T = any>(input: T): T {
  if (Array.isArray(input)) {
    // @ts-ignore
    return input.map((v) => deepStripUndefined(v)).filter((v) => v !== undefined) as T;
  }
  if (input && typeof input === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(input as any)) {
      if (v === undefined) continue;
      const next = deepStripUndefined(v as any);
      if (next !== undefined) out[k] = next;
    }
    return out as T;
  }
  return input;
}

export type SaleItem = SaleItemForm & {
  id?: string;
  providerId: string;
  providerName?: string | null;
  providerEmail?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

export async function createSaleItem(
  data: SaleItemForm & { providerId: string; providerName?: string | null; providerEmail?: string | null }
): Promise<string> {
  const payload = deepStripUndefined({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const ref = await addDoc(collection(db, COL), payload as any);
  return ref.id;
}

export async function updateSaleItem(id: string, patch: Partial<SaleItemForm>): Promise<void> {
  const ref = doc(db, COL, id);
  const clean = deepStripUndefined({ ...patch, updatedAt: serverTimestamp() });
  await updateDoc(ref, clean as any);
}

export async function getSaleItemById(id: string): Promise<SaleItem | null> {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as SaleItem;
}

export type SaleListFilters = {
  status?: 'pending' | 'approved' | 'sold' | 'hidden';
  city?: string;
  condition?: 'new' | 'like-new' | 'used' | 'for-parts';
  tradeEnabled?: boolean;
  maxPrice?: number;
  take?: number;
  sort?: 'newest' | 'priceLow' | 'priceHigh';
};

export async function listSaleItems(filters: SaleListFilters = {}) {
  const { status = 'approved', city, condition, tradeEnabled, maxPrice, take = 30, sort = 'newest' } = filters;
  const colRef = collection(db, COL);

  // Build primary query with minimal where clauses to avoid composite index requirements.
  const wheres: any[] = [];
  wheres.push(where('status', '==', status));
  if (city && city.toLowerCase() !== 'all cities') wheres.push(where('city', '==', city));
  if (typeof tradeEnabled === 'boolean') wheres.push(where('trade.enabled', '==', tradeEnabled));
  if (condition) wheres.push(where('condition', '==', condition));
  // NOTE: maxPrice filtering and ordering are done client-side to avoid composite indexes.

  let rows: any[] = [];
  try {
    const qy = query(colRef, ...wheres, orderBy('createdAt', 'desc'), limit(take));
    const snap = await getDocs(qy);
    rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch {
    // Drop orderBy if Firestore complains about composite index
    const qy = query(colRef, ...wheres, limit(take));
    const snap = await getDocs(qy);
    rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    // client sort newest
    rows.sort((a, b) => {
      const av = a?.createdAt?.toMillis?.() ?? 0;
      const bv = b?.createdAt?.toMillis?.() ?? 0;
      return bv - av;
    });
  }

  // Client-side filter/sort for price
  if (typeof maxPrice === 'number') rows = rows.filter((r) => (Number(r?.price ?? 0) <= maxPrice));
  if (sort === 'priceLow') rows = [...rows].sort((a, b) => (Number(a?.price ?? 0) - Number(b?.price ?? 0)));
  if (sort === 'priceHigh') rows = [...rows].sort((a, b) => (Number(b?.price ?? 0) - Number(a?.price ?? 0)));

  return rows as SaleItem[];
}

export async function listProviderSaleItems(providerId: string, opts: { status?: 'pending' | 'approved' | 'sold' | 'hidden' } = {}) {
  const { status } = opts;
  const colRef = collection(db, COL);
  try {
    const wheres: any[] = [where('providerId', '==', providerId)];
    if (status) wheres.push(where('status', '==', status));
    const qy = query(colRef, ...wheres, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SaleItem[];
  } catch {
    const wheres: any[] = [where('providerId', '==', providerId)];
    if (status) wheres.push(where('status', '==', status));
    const qy = query(colRef, ...wheres);
    const snap = await getDocs(qy);
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SaleItem[];
    return rows.sort((a: any, b: any) => {
      const av = a?.createdAt?.toMillis?.() ?? 0;
      const bv = b?.createdAt?.toMillis?.() ?? 0;
      return bv - av;
    });
  }
}

export async function deleteSaleItem(id: string) {
  const ref = doc(db, COL, id);
  await deleteDoc(ref);
}
