"use client";
import {
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  Share2,
  MessageCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MediaGallery from '@/components/media-gallery';
import StarRating from '@/components/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getServiceById, updateService, listServicesFiltered, type Service } from '@/lib/services';
import { findOrCreateConversation } from '@/lib/chat';
import ServiceMap from '@/components/service-map';
import { listReviewsByService, getUserReviewForService, upsertReview, deleteMyReview, type Review } from '@/lib/reviews';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getClientLocale, tr } from '@/lib/i18n';
import { getAuth } from 'firebase/auth';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = getClientLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState<number>(0);
  const [myText, setMyText] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<Array<Service & { distanceKm?: number }>>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(2);

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

  // no-op: carousel replaced by MediaGallery

  const whatsappLink = useMemo(() => {
    const number = (service as any)?.contactWhatsapp || (service as any)?.contactPhone;
    if (!service || !number) return null;
    const normalized = String(number).replace(/\+/g, '');
    return `https://wa.me/${normalized}?text=${encodeURIComponent(
      `Hello, I'm interested in your '${service.title}' service.`
    )}`;
  }, [service]);

  const [startingChat, setStartingChat] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleChat() {
    if (!service) return;
    if (service.providerId === 'demo') return;
    if (!user) {
      // Ask user to sign in then come back
      toast({ variant: 'destructive', title: tr(locale, 'chat.signInPrompt') });
      router.push('/login');
      return;
    }
    try {
      setStartingChat(true);
      const convId = await findOrCreateConversation(service.id!, service.providerId, user.uid);
      // Navigate to dedicated chat page
      router.push(`/messages/${convId}`);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('chat start failed', e);
      toast({ variant: 'destructive', title: 'لا يمكن بدء المحادثة' });
    } finally {
      setStartingChat(false);
    }
  }

  async function handleRequestService() {
    if (!service) return;
    if (service.providerId === 'demo') return;
    if (!user) {
      toast({ variant: 'destructive', title: tr(locale, 'form.toasts.pleaseSignInTitle'), description: tr(locale, 'form.toasts.pleaseSignInDesc') });
      router.push('/login');
      return;
    }
    try {
      setRequesting(true);
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error('auth');
      const res = await fetch('/api/request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ serviceId: service.id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'request_failed');
      toast({ title: tr(locale, 'details.requestSent') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'details.requestFailed') });
    } finally {
      setRequesting(false);
    }
  }

  async function handleShare() {
    if (!service) return;
    try {
      setSharing(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = service?.id ? `${origin}/services/${service.id}` : origin;
      let shared = false;
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        try {
          await (navigator as any).share({
            title: service.title || 'Khidmaty Connect',
            text: service.title || 'Discover local services on Khidmaty Connect',
            url,
          });
          shared = true;
        } catch {}
      }
      if (!shared && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      if (isOwner && service.id) {
        const nextCount = ((service as any).shareCount ?? 0) + 1;
        const nextPriority = Math.min(5, (((service as any).priority ?? 0) + 1));
        await updateService(service.id, { shareCount: nextCount, priority: nextPriority });
        setService({ ...(service as any), shareCount: nextCount, priority: nextPriority });
      }
      toast({ title: 'رابط المشاركة جاهز', description: (shared ? 'شكراً للمشاركة!' : 'تم نسخ الرابط.') });
    } catch {
      toast({ variant: 'destructive', title: 'فشلت المشاركة' });
    } finally {
      setSharing(false);
    }
  }

  // Load reviews once service is ready (skip for demo services)
  useEffect(() => {
    (async () => {
      if (!service || service.providerId === 'demo') return;
      try {
        const list = await listReviewsByService(service.id!);
        setReviews(list);
      } catch {}
    })();
  }, [service?.id]);

  // Load my review if signed in
  useEffect(() => {
    (async () => {
      if (!service || !user || service.providerId === 'demo') return;
      try {
        const mine = await getUserReviewForService(service.id!, user.uid);
        if (mine) {
          setMyRating(mine.rating || 0);
          setMyText(mine.text || '');
        } else {
          setMyRating(0);
          setMyText('');
        }
      } catch {}
    })();
  }, [service?.id, user?.uid]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const subservicesList = useMemo(() => {
    const arr = (service as any)?.subservices;
    return Array.isArray(arr) ? arr : [];
  }, [service?.subservices]);

  const isOwner = useMemo(() => {
    return !!(user && service && service.providerId === user.uid);
  }, [user?.uid, service?.providerId]);

  // Determine whether to hide price on this page (explicit URL params only)
  const hidePrice = useMemo(() => {
    try {
      return !!(searchParams?.get('hidePrice') || searchParams?.get('noPrice'));
    } catch {}
    return false;
  }, [searchParams]);

  // DEBUG: log owner check when service/user changes
  useEffect(() => {
    if (service && user) {
      // eslint-disable-next-line no-console
      console.log('[reviews] owner check', {
        serviceId: service.id,
        providerId: service.providerId,
        myUid: user.uid,
        isOwner,
      });
    }
  }, [service?.id, user?.uid, isOwner]);

  // Track a view when the service loads (skip demo services)
  useEffect(() => {
    if (!service || !service.id || service.providerId === 'demo') return;
    const controller = new AbortController();
    const ref = typeof document !== 'undefined' ? document.referrer || null : null;
    const city = service.city || null;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'service_view', serviceId: service.id, city, ref }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [service?.id]);

  async function handleSaveReview() {
    if (!service || !user) return;
    if (service.providerId === 'demo') {
      toast({ variant: 'destructive', title: 'Reviews are disabled for demo services.' });
      return;
    }
    // DEBUG: log attempt details
    // eslint-disable-next-line no-console
    console.log('[reviews] attempt save', {
      serviceId: service.id,
      providerId: service.providerId,
      myUid: user.uid,
      myRating,
      myTextLen: myText.length,
    });
    if (myRating < 1) {
      toast({ variant: 'destructive', title: tr(locale, 'reviews.toasts.requiredRating') });
      return;
    }
    try {
      setSaving(true);
      await upsertReview({ serviceId: service.id!, authorId: user.uid, rating: myRating, text: myText.slice(0, 1000) });
      // Refresh list and my state
      const list = await listReviewsByService(service.id!);
      setReviews(list);
      toast({ title: tr(locale, 'reviews.toasts.saved') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'reviews.toasts.saveFailed'), description: e?.message || '' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReview() {
    if (!service || !user) return;
    if (service.providerId === 'demo') {
      toast({ variant: 'destructive', title: 'Reviews are disabled for demo services.' });
      return;
    }
    try {
      setSaving(true);
      await deleteMyReview(service.id!, user.uid);
      const list = await listReviewsByService(service.id!);
      setReviews(list);
      setMyRating(0);
      setMyText('');
      toast({ title: tr(locale, 'reviews.toasts.deleted') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'reviews.toasts.deleteFailed'), description: e?.message || '' });
    } finally {
      setSaving(false);
    }
  }

  const coords = useMemo(() => {
    if (service?.lat != null && service?.lng != null) {
      return { lat: Number(service.lat), lng: Number(service.lng) };
    }
    return null;
  }, [service?.lat, service?.lng]);

  function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Load nearby services (other providers) near this service
  useEffect(() => {
    (async () => {
      if (!coords || !service?.city) {
        setNearbyServices([]);
        return;
      }
      try {
        setNearbyLoading(true);
        const list = await listServicesFiltered({ city: service.city, limit: 40 });
        const scored = list
          .filter((s) => s.id !== service.id)
          .filter(
            (s) =>
              typeof s.lat === 'number' &&
              typeof s.lng === 'number' &&
              !Number.isNaN(s.lat) &&
              !Number.isNaN(s.lng),
          )
          .map((s) => ({
            ...s,
            distanceKm: distanceKm(coords.lat, coords.lng, s.lat as number, s.lng as number),
          }))
          // Only keep services within the selected radius of the current service
          .filter((s) => (s.distanceKm ?? Infinity) <= nearbyRadiusKm)
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
          .slice(0, 6);
        setNearbyServices(scored);
      } catch {
        setNearbyServices([]);
      } finally {
        setNearbyLoading(false);
      }
    })();
  }, [coords?.lat, coords?.lng, service?.city, service?.id, nearbyRadiusKm]);


  // Build a privacy-friendly YouTube embed URL if provided
  const videoEmbedUrl = useMemo(() => {
    const raw = (service as any)?.videoUrl as string | undefined;
    const conv = (rawStr: string | undefined) => {
      if (!rawStr) return null;
      try {
        const url = new URL(rawStr);
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
        const t = url.searchParams.get('t') || url.searchParams.get('start') || undefined;
        let start: number | undefined = undefined;
        if (t) {
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
      } catch { return null; }
    };
    return conv(raw);
  }, [service?.videoUrl]);

  const videoEmbedUrls = useMemo(() => {
    const arr = (((service as any)?.videoUrls as string[] | undefined) || []).filter(Boolean);
    const out: string[] = [];
    for (const raw of arr) {
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
        if (!id) continue;
        const t = url.searchParams.get('t') || url.searchParams.get('start') || undefined;
        let start: number | undefined = undefined;
        if (t) {
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
        out.push(start && start > 0 ? `${base}?start=${start}` : base);
      } catch {}
    }
    return out;
  }, [service?.videoUrls]);

  // Helpers to normalize i18n keys
  function categoryKey(raw?: string | null): string {
    const s = String(raw || '').trim().toLowerCase();
    // Map common labels to slugs
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

  function cityKey(raw?: string | null): string {
    const s = String(raw || '').trim().toLowerCase();
    if (s.startsWith('trip')) return 'tripoli';
    if (s.startsWith('ben') || s.includes('benghazi')) return 'benghazi';
    if (s.startsWith('mis') || s.includes('misrata')) return 'misrata';
    return s;
  }

  const sep = locale === 'ar' ? '، ' : ', ';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-6">
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
          <div className="lg:col-span-8">
            <Card className="mb-6 md:w-2/3 mx-auto">
              <CardContent className="p-3 md:p-4">
                <MediaGallery
                  title={service.title}
                  images={service.images || []}
                  videoEmbedUrl={videoEmbedUrl}
                  videoEmbedUrls={videoEmbedUrls}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 md:w-2/3 mx-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-3xl font-bold font-headline md:text-4xl">
                  {service.title}
                </CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <Badge variant="secondary" className="text-base ps-2 pe-2">
                    {tr(locale, `categories.${categoryKey(service.category)}`)}
                  </Badge>
                  <div className={`${locale === 'ar' ? 'flex-row-reverse' : ''} flex items-center gap-1.5`}>
                    <MapPin className="h-5 w-5" />
                    <span>
                      {tr(locale, `cities.${cityKey(service.city)}`)}{service.area ? `${sep}${service.area}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StarRating value={Math.round(avgRating)} readOnly size="md" />
                    <span className="text-sm">({reviews.length})</span>
                  </div>
                </div>
                {!hidePrice && ((service as any)?.priceMode !== 'hidden') && (
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-primary">
                      {(() => {
                        const mode = String((service as any)?.priceMode || 'firm');
                        const price = Number((service as any)?.price || 0);
                        if (mode === 'call') return tr(locale, 'details.callForPrice');
                        const base = `${price} LYD`;
                        if (mode === 'negotiable') return `${base} (${tr(locale, 'details.negotiable')})`;
                        return base;
                      })()}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold font-headline mb-2">
                    {tr(locale, 'details.description')}
                  </h2>
                  <p className="whitespace-pre-wrap text-lg text-foreground/80">
                    {service.description}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-headline mb-2">
                    {tr(locale, 'details.availability')}
                  </h2>
                  <div className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <p>{service.availabilityNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6 md:w-2/3 mx-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold font-headline">
                  {tr(locale, 'details.location')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    {tr(locale, 'details.approxIn')} {service.city}
                    {service.area ? `, ${service.area}` : ''}.
                  </div>
                  {(service as any)?.mapUrl && (
                    <div>
                      <a
                        className="underline inline-flex items-center gap-2"
                        href={(service as any).mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {tr(locale, 'details.viewOnMap')}
                      </a>
                    </div>
                  )}
                  {coords && (
                    <ServiceMap
                      lat={coords.lat}
                      lng={coords.lng}
                      title={service.title}
                      city={service.city}
                      area={service.area}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            
          </div>

          <div className="lg:col-span-4">
            

            <Card className="sticky top-24 mb-6">
              {!hidePrice && !!((service as any)?.showPriceInContact) && ((service as any)?.priceMode !== 'hidden') && (
                <CardHeader>
                  <CardTitle className="text-center text-muted-foreground">
                    {tr(locale, 'details.servicePrice')}
                  </CardTitle>
                  <p className="text-center text-4xl font-bold text-primary">
                    {(() => {
                      const mode = String((service as any)?.priceMode || 'firm');
                      const price = Number((service as any)?.price || 0);
                      if (mode === 'call') return tr(locale, 'details.callForPrice');
                      const base = `${price} LYD`;
                      if (mode === 'negotiable') return `${base} (${tr(locale, 'details.negotiable')})`;
                      return base;
                    })()}
                  </p>
                </CardHeader>
              )}
              <CardContent className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="h-12 w-full text-lg"
                  onClick={handleShare}
                  disabled={sharing}
                >
                  <Share2 className="mr-2" /> {isOwner ? tr(locale, 'details.shareAppOwner') : tr(locale, 'details.shareService')}
                </Button>
                {service.providerId !== 'demo' && !isOwner && ((service as any)?.acceptRequests !== false) && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full text-lg"
                    onClick={handleRequestService}
                    disabled={requesting}
                  >
                    {tr(locale, 'details.requestService')}
                  </Button>
                )}
                {/* Call provider (phone) */}
                {((service as any)?.contactPhone) && (
                  <Button asChild size="lg" variant="secondary" className="h-12 w-full text-lg">
                    <a href={`tel:${String((service as any).contactPhone).replace(/\s+/g, '')}`}>
                      <Phone className="mr-2" /> {tr(locale, 'details.callProvider')}
                    </a>
                  </Button>
                )}
                {/* Social links */}
                {((service as any)?.facebookUrl || (service as any)?.telegramUrl) && (
                  <div className="rounded border bg-background p-3">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">{tr(locale, 'details.social')}</div>
                    <div className="flex flex-col gap-2 text-sm">
                      {(service as any)?.facebookUrl && (
                        <a className="underline inline-flex items-center gap-2" href={(service as any).facebookUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4"/>
                          Facebook
                        </a>
                      )}
                      {(service as any)?.telegramUrl && (
                        <a className="underline inline-flex items-center gap-2" href={(service as any).telegramUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4"/>
                          Telegram
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {subservicesList.length > 0 && (
                  <div className="rounded border bg-background p-3">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">{tr(locale, 'details.subservices')}</div>
                    <ul className="space-y-1">
                      {subservicesList.map((s: any) => (
                        <li key={s.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">
                            {s.title}
                            {s.unit ? <span className="text-muted-foreground"> ({s.unit})</span> : null}
                          </span>
                          {!hidePrice && ((service as any)?.priceMode !== 'hidden') && (
                            <span className="whitespace-nowrap font-medium">LYD {Number(s.price ?? 0)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {((service as any)?.contactWhatsapp || (service as any)?.contactPhone) ? (
                  <>
                    {/* In-app chat: visible for signed-in non-owners and non-demo services */}
                    {service.providerId !== 'demo' && !isOwner && (
                      <Button size="lg" className="h-12 w-full text-lg" onClick={handleChat} disabled={startingChat}>
                        {tr(locale, 'details.chatInApp')}
                      </Button>
                    )}
                    <Button asChild size="lg" className="h-12 w-full bg-green-500 text-lg text-white hover:bg-green-600">
                      <a
                        href={whatsappLink ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (!service?.id) return;
                          const ref = typeof document !== 'undefined' ? document.referrer || null : null;
                          const city = service?.city || null;
                          fetch('/api/track', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'cta_click', serviceId: service.id, city, ref }),
                          }).catch(() => {});
                        }}
                      >
                        <MessageCircle className="mr-2" />
                        {tr(locale, 'details.contactWhatsApp')}
                      </a>
                    </Button>
                    {(service as any)?.contactPhone && (
                      <Button asChild size="lg" variant="outline" className="h-12 w-full text-lg">
                        <a
                          href={`tel:${(service as any).contactPhone}`}
                          onClick={() => {
                            if (!service?.id) return;
                            const ref = typeof document !== 'undefined' ? document.referrer || null : null;
                            const city = service?.city || null;
                            fetch('/api/track', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ type: 'cta_click', serviceId: service.id, city, ref }),
                            }).catch(() => {});
                          }}
                        >
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
                <Button size="lg" variant="outline" className="h-12 w-full text-lg" asChild>
                  <a href="#reviews">{tr(locale, 'reviews.writeReview')}</a>
                </Button>
              </CardContent>
            </Card>
            

            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle id="reviews" className="scroll-mt-24 text-2xl font-bold font-headline">
                  {tr(locale, 'details.reviews')}
                </CardTitle>
                <div className="mt-1 flex items-center gap-3">
                  <StarRating value={Math.round(avgRating)} readOnly size="lg" />
                  <span className="text-sm text-muted-foreground">({reviews.length})</span>
                </div>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((r, idx) => (
                      <div key={r.id || idx} className="rounded border bg-background p-3">
                        <StarRating value={r.rating || 0} readOnly size="sm" />
                        {r.text ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{r.text}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{tr(locale, 'reviews.empty')}</p>
                )}
                <div className="mt-4">
                  {isOwner ? (
                    <p className="text-sm text-muted-foreground">{tr(locale, 'reviews.ownerBlocked')}</p>
                  ) : service.providerId === 'demo' ? (
                    <p className="text-sm text-muted-foreground">التقييمات معطلة للخدمات التجريبية.</p>
                  ) : (
                    <div className="rounded border bg-background p-4">
                      <label className="mb-2 block text-sm font-medium">{tr(locale, 'reviews.ratingLabel')}</label>
                      <StarRating value={myRating} onChange={user ? setMyRating : undefined} size="lg" />
                      {!user && (
                        <p className="mt-2 text-xs text-muted-foreground">{tr(locale, 'reviews.signInPrompt')}</p>
                      )}
                      <label className="mb-2 mt-4 block text-sm font-medium">{tr(locale, 'reviews.writeReview')}</label>
                      <Textarea
                        value={myText}
                        onChange={(e) => user && setMyText(e.target.value)}
                        placeholder={tr(locale, 'reviews.placeholder')}
                        className="min-h-[100px]"
                        disabled={!user}
                      />
                      <div className="mt-3 flex gap-2">
                        {user ? (
                          <>
                            <Button onClick={handleSaveReview} disabled={saving}>
                              {tr(locale, myRating > 0 ? 'reviews.update' : 'reviews.submit')}
                            </Button>
                            {reviews.some((r) => r.id === user.uid || (r as any).authorId === user.uid) && (
                              <Button variant="outline" onClick={handleDeleteReview} disabled={saving}>
                                {tr(locale, 'reviews.delete')}
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button asChild>
                            <Link href="/login">{tr(locale, 'header.login')}</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {coords && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">
                    {locale === 'ar' ? 'خدمات أخرى قريبة' : 'Other services nearby'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                 <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
  <span className="text-muted-foreground">
    {locale === 'ar'
      ? 'ابحث عن خدمات ضمن مسافة (كم):'
      : 'Search services within distance (km):'}
  </span>
  <select
    className="h-8 rounded border px-2 text-xs bg-background"
    value={String(nearbyRadiusKm)}
    onChange={(e) => setNearbyRadiusKm(Number(e.target.value))}
  >
    {[0.5, 1, 2, 4,5,6,7,8,9,10].map((km) => (
      <option key={km} value={km}>
        {km}
      </option>
    ))}
  </select>
</div>


                  {nearbyLoading && (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ar' ? 'جاري تحميل الخدمات القريبة...' : 'Loading nearby services...'}
                    </p>
                  )}
                  {!nearbyLoading && nearbyServices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ar' ? 'لا توجد خدمات قريبة حتى الآن.' : 'No nearby services yet.'}
                    </p>
                  )}

                  <div className="space-y-3">
                    {nearbyServices.map((svc) => (
                      <Link
                        key={svc.id}
                        href={`/services/${svc.id}`}
                        className="flex gap-3 rounded-lg border bg-card p-2 text-xs hover:bg-accent"
                      >
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {Array.isArray(svc.images) && (svc.images[0] as any)?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={(svc.images[0] as any).url}
                              alt={svc.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              {locale === 'ar' ? 'بدون صورة' : 'No image'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="truncate text-sm font-semibold">{svc.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {svc.city}
                            {svc.area ? ` • ${svc.area}` : ''}
                          </div>
                          {typeof svc.distanceKm === 'number' && (
                            <div className="text-[11px] text-muted-foreground">
                              {svc.distanceKm.toFixed(1)} km
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </>
          )}
        </div>
      </main>
    
    </div>
  );
}
