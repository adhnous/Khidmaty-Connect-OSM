import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { transformCloudinary } from '@/lib/images';

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
  const displayUrl = transformCloudinary(imageUrl, { w: 600, q: 'auto' });
  const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U5ZTplZSIvPjwvc3ZnPg==';
  const content = (
    <Card className="h-full w-full overflow-hidden transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
      <CardHeader className="p-0">
        <Image
          src={displayUrl}
          alt={title}
          width={400}
          height={300}
          className="aspect-video w-full object-cover"
          data-ai-hint={aiHint}
          placeholder="blur"
          blurDataURL={blur}
        />
      </CardHeader>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">
          {category}
        </Badge>
        <CardTitle className="font-headline text-lg line-clamp-2">
          {title}
        </CardTitle>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          <span>{city}</span>
        </div>
        <p className="text-lg font-semibold text-primary">{price} LYD</p>
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
