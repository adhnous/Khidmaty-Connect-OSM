import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { transformCloudinary } from '@/lib/images';
import { getClientLocale, tr } from '@/lib/i18n';
import { cityLabel } from '@/lib/cities';

type ServiceCardProps = {
  id?: string;
  title: string;
  category: string;
  city: string;
  price: number;
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
  imageUrl,
  aiHint,
  href,
}: ServiceCardProps) {
  const displayUrl = transformCloudinary(imageUrl, { w: 500, q: 'auto' });
  const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U5ZTplZSIvPjwvc3ZnPg==';
  const locale = getClientLocale();
  const content = (
    <Card className="group h-full w-full overflow-hidden rounded-xl border bg-background/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={displayUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          data-ai-hint={aiHint}
          placeholder="blur"
          blurDataURL={blur}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <Badge variant="secondary" className="absolute left-3 bottom-3 bg-background/90 text-xs shadow-sm">
          {tr(locale, `categories.${category}`)}
        </Badge>
      </div>
      <CardContent className="p-3">
        <CardTitle className="line-clamp-2 font-headline text-base">
          {title}
        </CardTitle>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-3 pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="mr-1 h-3.5 w-3.5" />
          <span>{cityLabel(locale, city)}</span>
        </div>
        <p className="text-base font-semibold text-primary">LYD {price}</p>
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
