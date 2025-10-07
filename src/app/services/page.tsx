"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { ServiceCard } from '@/components/service-card';

 type Svc = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  price: number | null;
  imageUrl: string | null;
};

export default function ServicesListPage() {
  const [rows, setRows] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const q = query(
          collection(db, 'services'),
          where('status', '==', 'approved'),
          limit(24)
        );
        const snap = await getDocs(q);
        const list: Svc[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          const images = Array.isArray(d?.images) ? d.images : [];
          list.push({
            id: doc.id,
            title: String(d?.title ?? ''),
            category: (d?.category as string) ?? null,
            city: (d?.city as string) ?? null,
            price: typeof d?.price === 'number' ? d.price : null,
            imageUrl: images[0]?.url ?? null,
          });
        });
        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load services');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Services</h1>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border p-4 text-muted-foreground">No services yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <ServiceCard
              key={r.id}
              id={r.id}
              title={r.title || r.id}
              category={r.category || 'other'}
              city={r.city || 'tripoli'}
              price={r.price ?? 0}
              imageUrl={r.imageUrl || 'https://placehold.co/800x600?text=Service'}
              aiHint={`category:${r.category || 'other'}; city:${r.city || 'tripoli'}`}
              href={`/services/${r.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
