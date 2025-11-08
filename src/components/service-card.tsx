"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { transformCloudinary } from '@/lib/images';
import { getClientLocale, tr } from '@/lib/i18n';
import { cityLabel } from '@/lib/cities';
import { useEffect, useMemo, useState } from 'react';
import StarRating from '@/components/star-rating';
import { listReviewsByService, type Review } from '@/lib/reviews';
import { useRouter, useSearchParams } from 'next/navigation';

type ServiceCardProps = {
  id?: string;
  title: string;
  category: string;
  city: string;
  price: number;
  priceMode?: 'firm' | 'negotiable' | 'call' | 'hidden';
  imageUrl: string;
  aiHint: string;
  href?: string;
};

export function ServiceCard({
  id,
  title,
  category,
  city,
  price,
  priceMode,
  imageUrl,
  aiHint,
  href,
}: ServiceCardProps) {
  const isInline = typeof imageUrl === 'string' && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'));
  const displayUrl = isInline ? imageUrl : transformCloudinary(imageUrl, { w: 500, q: 'auto' });
  const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U5ZTplZSIvPjwvc3ZnPg==';
  const locale = getClientLocale();
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailHref = href ?? (id ? `/services/${id}` : undefined);

  function goToReviews(e: React.MouseEvent) {
    if (!detailHref) return;
    e.preventDefault();
    e.stopPropagation();
    router.push(`${detailHref}#reviews`);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) return;
        const list = await listReviewsByService(id, 20);
        if (alive) setReviews(list);
      } catch {
        if (alive) setReviews([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const reviewsCount = reviews.length;
  const avgRating = useMemo(() => {
    if (!reviewsCount) return 0;
    return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount;
  }, [reviews, reviewsCount]);
  const hidePrice = useMemo(() => {
    try {
      return !!(searchParams?.get('hidePrice') || searchParams?.get('noPrice'));
    } catch {}
    return false;
  }, [searchParams]);
  const content = (
    <Card className="group h-full w-full overflow-hidden rounded-xl border bg-background/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-t-xl bg-muted">
        {isInline ? (
          <img
            src={displayUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center"
            data-ai-hint={aiHint}
          />
        ) : (
          <Image
            src={displayUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            data-ai-hint={aiHint}
            placeholder="blur"
            blurDataURL={blur}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 md:h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge variant="secondary" className="absolute left-3 bottom-3 bg-background/90 text-xs shadow-sm">
          {tr(locale, `categories.${normalizeCategory(category)}`)}
        </Badge>
      </div>
      <CardContent className="p-2.5 md:p-3">
        <CardTitle className="line-clamp-2 font-headline text-sm md:text-base">
          {title}
        </CardTitle>
        <div className="mt-1">
          <div
            role="link"
            tabIndex={0}
            onClick={goToReviews}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToReviews(e as any);
              }
            }}
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 rounded cursor-pointer"
            aria-label="View reviews"
            data-reviews-link
          >
            <StarRating value={Math.round(avgRating)} readOnly size="sm" />
            <span className="text-xs text-muted-foreground">({reviewsCount})</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-2.5 md:p-3 pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="mr-1 h-3.5 w-3.5" />
          <span>{cityLabel(locale, city)}</span>
        </div>
        {!hidePrice && priceMode !== 'hidden' && (
          <p className="text-sm md:text-base font-semibold text-primary">
            {(() => {
              const mode = String(priceMode || 'firm');
              if (mode === 'call') return tr(locale, 'details.callForPrice');
              const base = `LYD ${price}`;
              if (mode === 'negotiable') return `${base} (${tr(locale, 'details.negotiable')})`;
              return base;
            })()}
          </p>
        )}
      </CardFooter>
    </Card>
  );

  return href ? (
    <Link href={href} className="group">
      {content}
    </Link>
  ) : (
    <div className="group cursor-default">{content}</div>
  );
}

function normalizeCategory(raw?: string): string {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'general';
  if (s.includes('plumb')) return 'plumbing';
  if (s.includes('automot') || s.includes('mechanic') || s.includes('car')) return 'automotive';
  if (s.includes('electr')) return 'electrical';
  if (s.includes('digital')) return 'digitalMarketing';
  if (s.includes('marketing')) return 'digitalMarketing';
  if (s.includes('home')) return 'homeServices';
  if (s.includes('transport') || s.includes('delivery')) return 'transport';
  if (s.includes('wash')) return 'carWash';
  if (s.includes('child')) return 'childcare';
  if (s.includes('educat') || s.includes('tutor') || s.includes('training')) return 'education';
  if (s.includes('general')) return 'general';
  return s.replace(/\s+|&|\//g, '').replace(/-/g, '').toLowerCase();
}
