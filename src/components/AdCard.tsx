"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdCard({ ad }: { ad: any }) {
  const image = String(ad?.imageUrl || "");
  const title = String(ad?.title || ad?.text || ad?.textAr || "");
  const link = typeof ad?.linkUrl === 'string' && ad.linkUrl ? ad.linkUrl : (typeof ad?.href === 'string' ? ad.href : '');
  const card = (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {image && (
        <div className="aspect-square relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title || 'Ad'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute left-2 top-2">
            <Badge className="rounded-full bg-white/90 text-foreground shadow-sm" variant="secondary">إعلان</Badge>
          </div>
        </div>
      )}
      {title && (
        <div className="p-3">
          <div className="text-sm font-semibold line-clamp-1">{title}</div>
        </div>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} target="_blank" rel="noreferrer">
        {card}
      </Link>
    );
  }
  return card;
}
