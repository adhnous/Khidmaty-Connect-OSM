"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import Link from "next/link";
import { getClientLocale } from "@/lib/i18n";

export type AdItem = {
  id: string;
  text: string;
  textAr?: string | null;
  href?: string | null;
  color?: "copper" | "power" | "dark" | "light";
  active?: boolean;
  priority?: number;
};

export default function AdStrip() {
  const [ads, setAds] = useState<AdItem[]>([]);
  

  useEffect(() => {
    const q = query(
      collection(db, "ads"),
      where("active", "==", true),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const next: AdItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as any;
        const rawColor: string | undefined = typeof d?.color === 'string' ? d.color : undefined;
        const allowed = ["copper", "power", "dark", "light"] as const;
        const color: AdItem["color"] = (rawColor && (allowed as readonly string[]).includes(rawColor))
          ? (rawColor as AdItem["color"]) : ("copper" as const);
        next.push({
          id: doc.id,
          text: String(d?.text ?? ""),
          textAr: d?.textAr || null,
          href: d?.href || null,
          color,
          active: !!d?.active,
          priority: typeof d?.priority === 'number' ? d.priority : Number(d?.priority) || 0,
        });
      });
      // Sort client-side by priority desc
      next.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      setAds(next);
    }, (err) => {
      // On permission or index errors, show nothing silently but log for debugging
      console.warn('[AdStrip] ads snapshot error:', err);
      setAds([]);
    });
    return () => unsub();
  }, []);

  const locale = getClientLocale();

  const items = useMemo(() => {
    if (ads.length > 0) return ads;
    // Fallback demo when no ads exist
    return [
      { id: "demo-1", text: "Advertise your service to thousands of users.", textAr: "أعلن عن خدمتك لآلاف المستخدمين.", href: "/dashboard/services", color: "copper" as const },
    ];
  }, [ads]);

  if (items.length === 0) return null;

  function bg(c?: AdItem["color"]) {
    if (c === "power") return "bg-red-600 text-white";
    if (c === "dark") return "bg-black text-white";
    if (c === "light") return "bg-white text-black border-b";
    return "bg-amber-500 text-black"; // copper-ish
  }

  const isSingle = items.length === 1;

  return (
    <div className={`ad-marquee ${bg(items[0]?.color)} select-none`}>
      <div className="container mx-auto flex items-center gap-3 py-2">
        <div className={`ad-track`}>
          {/* Duplicate sequence to ensure seamless scroll */}
          <div className="ad-seq">
            {items.map((ad) => (
              <AdBadge key={`a1-${ad.id}`} ad={ad} />
            ))}
          </div>
          {isSingle && <div className="ad-spacer" aria-hidden="true" />}
          <div className="ad-seq">
            {items.map((ad) => (
              <AdBadge key={`a2-${ad.id}`} ad={ad} />
            ))}
          </div>
        </div>
        <Link href="/dashboard" className="ml-auto rounded px-2 py-1 text-xs bg-black text-white hover:opacity-90">
          Advertise with us
        </Link>
      </div>
    </div>
  );
}

function AdBadge({ ad }: { ad: AdItem }) {
  const locale = getClientLocale();
  const label = (locale === 'ar' ? (ad.textAr || ad.text) : ad.text) || '';
  const content = (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-sm text-black backdrop-blur">
      <span className="font-semibold">{locale === 'ar' ? 'إعلان' : 'Ad'}</span>
      <span className="truncate max-w-[60vw] sm:max-w-none">{label}</span>
    </span>
  );
  if (ad.href) {
    return (
      <Link href={ad.href} className="mx-3 inline-block">
        {content}
      </Link>
    );
  }
  return <span className="mx-3 inline-block">{content}</span>;
}
