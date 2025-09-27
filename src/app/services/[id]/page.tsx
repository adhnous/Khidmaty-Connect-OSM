"use client";

import Image from 'next/image';
import {
  Calendar,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getServiceById, type Service } from '@/lib/services';
import ServiceMap from '@/components/service-map';
import { transformCloudinary } from '@/lib/images';
import { getClientLocale, tr } from '@/lib/i18n';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const locale = getClientLocale();

  useEffect(() => {
    const raw = (params as any)?.id as string | string[] | undefined;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    // Support demo detail pages for mock cards like /services/demo-1
    if (id.startsWith('demo-')) {
      const numeric = parseInt(id.replace('demo-', ''), 10) || 1;
      const demo: Service = {
        id,
        title:
          numeric === 1
            ? 'Professional Plumbing Repairs & Installation'
            : numeric === 2
            ? 'Full House Cleaning Service'
            : numeric === 3
            ? 'Expert Car Mechanic for All Brands'
            : 'Private Math & Science Tutoring',
        description:
          'This is a demo service. Create a real service from your dashboard to replace demo content with your own details and images.',
        price: numeric === 2 ? 250 : numeric === 3 ? 200 : 150,
        category:
          numeric === 1
            ? 'Plumbing'
            : numeric === 2
            ? 'Home Services'
            : numeric === 3
            ? 'Automotive'
            : 'Education',
        city: numeric === 2 ? 'Benghazi' : numeric === 3 ? 'Misrata' : 'Tripoli',
        area: 'City Center',
        availabilityNote: 'Available 9 AM – 6 PM',
        images: [
          { url: 'https://placehold.co/800x600.png', hint: 'demo image' },
          { url: 'https://placehold.co/800x600.png', hint: 'demo image' },
        ],
        contactPhone: undefined,
        contactWhatsapp: undefined,
        providerId: 'demo',
        createdAt: undefined,
      };
      setService(demo);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const doc = await getServiceById(id);
        if (!doc) {
          setNotFound(true);
        } else {
          setService(doc);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    if (!carouselApi) return;
    const id = setInterval(() => {
      if (carouselApi.canScrollNext()) carouselApi.scrollNext();
      else carouselApi.scrollTo(0);
    }, 10000);
    return () => clearInterval(id);
  }, [carouselApi]);

  const whatsappLink = useMemo(() => {
    const number = (service as any)?.contactWhatsapp || (service as any)?.contactPhone;
    if (!service || !number) return null;
    const normalized = String(number).replace(/\+/g, '');
    return `https://wa.me/${normalized}?text=${encodeURIComponent(
      `Hello, I'm interested in your '${service.title}' service.`
    )}`;
  }, [service]);

  const coords = useMemo(() => {
    if (service?.lat != null && service?.lng != null) {
      return { lat: Number(service.lat), lng: Number(service.lng) };
    }
    if (!service?.city) return null as null | { lat: number; lng: number };
    const city = (service.city || '').toLowerCase();
    // Approximate centroids for major Libyan cities used in the app
    if (city === 'tripoli') return { lat: 32.8872, lng: 13.1913 };
    if (city === 'benghazi') return { lat: 32.1167, lng: 20.0667 };
    if (city === 'misrata') return { lat: 32.3783, lng: 15.0906 };
    return null;
  }, [service?.city, service?.lat, service?.lng]);

  // Build a privacy-friendly YouTube embed URL if provided
  const videoEmbedUrl = useMemo(() => {
    const raw = (service as any)?.videoUrl as string | undefined;
    if (!raw) return null;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      let id: string | null = null;
      if (host.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) id = v;
        if (!id && url.pathname.startsWith('/embed/')) id = url.pathname.split('/embed/')[1]?.split(/[?&]/)[0] ?? null;
        if (!id && url.pathname.startsWith('/shorts/')) id = url.pathname.split('/shorts/')[1]?.split(/[?&]/)[0] ?? null;
      } else if (host.includes('youtu.be')) {
        id = url.pathname.replace(/^\//, '').split(/[?&]/)[0] || null;
      }
      if (!id) return null;
      // Parse optional start time
      const t = url.searchParams.get('t') || url.searchParams.get('start') || undefined;
      let start: number | undefined = undefined;
      if (t) {
        // Parse formats like 90, 45s, 1m30s, 1h2m3s
        const m = String(t).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?|(\d+)/);
        if (m) {
          if (m[4]) start = parseInt(m[4], 10);
          else {
            const h = m[1] ? parseInt(m[1], 10) : 0;
            const mm = m[2] ? parseInt(m[2], 10) : 0;
            const ss = m[3] ? parseInt(m[3], 10) : 0;
            start = h * 3600 + mm * 60 + ss;
          }
        }
      }
      const base = `https://www.youtube-nocookie.com/embed/${id}`;
      return start && start > 0 ? `${base}?start=${start}` : base;
    } catch {
      return null;
    }
  }, [service?.videoUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container grid gap-8 md:grid-cols-3 lg:gap-12">
          {loading && (
            <div className="md:col-span-3 text-center text-muted-foreground">{tr(locale, 'details.loading')}</div>
          )}
          {!loading && (notFound || error) && (
            <div className="md:col-span-3 text-center">
              <h2 className="mb-2 text-2xl font-bold">{tr(locale, 'details.notFoundTitle')}</h2>
              <p className="mb-4 text-muted-foreground">
                {error ? tr(locale, 'details.notFoundBodyError') : tr(locale, 'details.notFoundBodyRemoved')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/" className="underline">{tr(locale, 'details.goHome')}</Link>
                <Link href="/dashboard/services" className="underline">{tr(locale, 'details.backToMyServices')}</Link>
              </div>
            </div>
          )}
          {!loading && service && (
          <>
          <div className="md:col-span-2">
            <Carousel className="mb-8 w-full overflow-hidden rounded-lg border" opts={{ loop: true }} setApi={setCarouselApi}>
              <CarouselContent>
                {(service.images && service.images.length > 0 ? service.images : [{ url: 'https://placehold.co/800x600.png' }]).map((img, index) => (
                  <CarouselItem key={index}>
                    <Image
                      src={transformCloudinary(img.url, { w: 1000, q: 'auto' })}
                      alt={`${service.title} - image ${index + 1}`}
                      width={800}
                      height={600}
                      className="aspect-video w-full object-cover"
                      data-ai-hint={(img as any).hint}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>

            <h1 className="mb-4 text-3xl font-bold font-headline md:text-4xl">
              {service.title}
            </h1>
            <div className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground">
              <Badge variant="secondary" className="text-base">
                {service.category}
              </Badge>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-5 w-5" />
                <span>
                  {service.city}, {service.area}
                </span>
              </div>
            </div>

            <h2 className="border-t pt-6 text-2xl font-bold font-headline mb-3">
              {tr(locale, 'details.description')}
            </h2>
            <p className="whitespace-pre-wrap text-lg text-foreground/80">
              {service.description}
            </p>

            {videoEmbedUrl && (
              <>
                <h2 className="mt-6 border-t pt-6 text-2xl font-bold font-headline mb-3">
                  {tr(locale, 'details.video')}
                </h2>
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <iframe
                    src={videoEmbedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${service.title} - video`}
                  />
                </div>
              </>
            )}

            <h2 className="mt-6 border-t pt-6 text-2xl font-bold font-headline mb-3">
              {tr(locale, 'details.availability')}
            </h2>
            <div className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p>{service.availabilityNote}</p>
            </div>

            {coords && (
              <>
                <h2 className="mt-6 border-t pt-6 text-2xl font-bold font-headline mb-3">
                  {tr(locale, 'details.location')}
                </h2>
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    {tr(locale, 'details.approxIn')} {service.city}
                    {service.area ? `, ${service.area}` : ''}.
                  </div>
                  <ServiceMap
                    lat={coords.lat}
                    lng={coords.lng}
                    title={service.title}
                    city={service.city}
                    area={service.area}
                  />
                </div>
              </>
            )}
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground">
                  {tr(locale, 'details.servicePrice')}
                </CardTitle>
                <p className="text-center text-4xl font-bold text-primary">
                  {service.price} LYD
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {((service as any)?.contactWhatsapp || (service as any)?.contactPhone) ? (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 w-full bg-green-500 text-lg text-white hover:bg-green-600"
                    >
                      <a href={whatsappLink ?? '#'} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2" />
                        {tr(locale, 'details.contactWhatsApp')}
                      </a>
                    </Button>
                    {(service as any)?.contactPhone && (
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="h-12 w-full text-lg"
                      >
                        <a href={`tel:${(service as any).contactPhone}`}>
                          <Phone className="mr-2" />
                          {tr(locale, 'details.callProvider')}
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    {tr(locale, 'details.noContact')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
