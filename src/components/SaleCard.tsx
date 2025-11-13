"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getClientLocale } from "@/lib/i18n";
import StarRating from "@/components/star-rating";
import { MapPin } from "lucide-react";
import { cityLabel } from "@/lib/cities";

export default function SaleCard({ item }: { item: any }) {
  const locale = getClientLocale();
  const id = String(item?.id || "");
  const main = item?.images?.[0]?.url as string | undefined;
  const title = String(item?.title || "");
  const priceMode = String(item?.priceMode || "firm");
  const price = Number(item?.price || 0);
  const condition = String(item?.condition || "");
  const city = String(item?.city || "");
  const area = String(item?.area || "");
  const tradeEnabled = !!(item?.trade?.enabled);
  const hideExact = !!item?.hideExactLocation;
  const rating = Number(item?.rating ?? 0);
  const reviewsCount = Number(item?.reviewsCount ?? 0);
  const conditionLabel = (() => {
    const m: Record<string, string> = {
      'new': locale==='ar' ? 'جديد' : 'New',
      'like-new': locale==='ar' ? 'شبه جديد' : 'Like new',
      'used': locale==='ar' ? 'مستعمل' : 'Used',
      'for-parts': locale==='ar' ? 'قطع' : 'For parts',
    };
    return m[condition] || (locale==='ar' ? 'المبيعات والتجارة' : 'Sales & Trade');
  })();
  const priceLabel = (() => {
    if (priceMode === 'firm') return `${locale==='ar'?'LYD':''} LYD ${price}`.replace('LYD LYD','LYD');
    if (priceMode === 'negotiable') return locale==='ar' ? 'قابل للتفاوض' : 'Negotiable';
    if (priceMode === 'call') return locale==='ar' ? 'اتصل لمعرفة السعر' : 'Call for price';
    return '—';
  })();
  const content = (
    <div className="group rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {main && (
        <div className="aspect-square relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {main.startsWith("data:") || main.startsWith("blob:") ? (
            <img src={main} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image src={main} alt={title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
          )}
          <div className="absolute left-2 top-2">
            <Badge className="rounded-full bg-white/90 text-foreground shadow-sm" variant="secondary">{conditionLabel}</Badge>
          </div>
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="text-sm font-semibold line-clamp-1">{title}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>({reviewsCount})</span>
            <StarRating value={Math.max(0, Math.min(5, rating))} readOnly size="sm" />
          </div>
          {(tradeEnabled || hideExact) && (
            <div className="flex items-center gap-1">
              {tradeEnabled && <Badge variant="secondary" className="px-2 py-0 h-5">{locale==='ar'? 'مبادلة' : 'Trade'}</Badge>}
              {hideExact && <Badge variant="outline" className="px-2 py-0 h-5">{locale==='ar'? 'الموقع مخفي' : 'Location hidden'}</Badge>}
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm font-bold text-primary">{priceLabel}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{cityLabel(locale as any, city)}{area ? ` • ${area}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return id ? (
    <Link href={`/sales/${id}`} className="block">
      {content}
    </Link>
  ) : content;
}
