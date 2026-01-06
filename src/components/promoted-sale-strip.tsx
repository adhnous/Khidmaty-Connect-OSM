"use client";

import { useEffect, useMemo, useState } from "react";
import { listPromotedSaleItems } from "@/lib/ads";
import SaleCard from "@/components/SaleCard";

export default function PromotedSaleStrip({ take = 8 }: { take?: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await listPromotedSaleItems(take);
        setItems(rows || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [take]);

  const sequences = useMemo(() => {
    const MIN_ITEMS = 6;
    const repeats = Math.ceil(MIN_ITEMS / Math.max(items.length, 1));
    const seq: any[] = [];
    for (let i = 0; i < repeats; i++) seq.push(...items);
    return seq;
  }, [items]);

  if (loading || sequences.length === 0) return null;

  const shouldBounce = sequences.length <= 4;

  return (
    <div className="ad-marquee">
      <div className={`ad-track ${shouldBounce ? 'single' : ''}`}>
        <div className="ad-seq">
          {sequences.map((it, idx) => (
            <div key={`seq-a-${it.id}-${idx}`} className="mx-2 w-44 md:w-56 lg:w-60 shrink-0">
              <SaleCard item={it} />
            </div>
          ))}
        </div>
        {!shouldBounce && (
          <div className="ad-seq" aria-hidden="true">
            {sequences.map((it, idx) => (
              <div key={`seq-b-${it.id}-${idx}`} className="mx-2 w-44 md:w-56 lg:w-60 shrink-0">
                <SaleCard item={it} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
