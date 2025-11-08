"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { deleteField } from 'firebase/firestore';
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet';
import { reverseGeocodeNominatim, getLangFromDocument } from '@/lib/geocode';

import { getServiceById, updateService, uploadServiceImages, type Service, type ServiceImage } from '@/lib/services';
import { serviceSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { getClientLocale, tr } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUp, ArrowDown, MoreHorizontal, Pencil, Link as LinkIcon, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { libyanCities, cityLabel, cityCenter } from '@/lib/cities';
import { CategoryCards, CATEGORY_DEFS } from '@/components/category-cards';
import CityPicker from '@/components/city-picker';

const EditSchema = serviceSchema; // reuse same fields

type EditFormData = z.infer<typeof EditSchema>;

function extractAreaFromDisplayName(name: string): string {
  try {
    const parts = String(name || '').split(/،|,/).map((p) => p.trim()).filter(Boolean);
    return parts[0] || '';
  } catch {
    return '';
  }
}

// Map detailed categories to the creation-phase CategoryCards ids
function mapCategoryToCardId(cat: string): string {
  const c = String(cat || '').toLowerCase();
  if (!c) return 'repair';
  const has = (s: string) => c.includes(s);
  // Repair / Home services
  if ([
    'plumbing','electrical','carpentry','home services','cleaning','painting','hvac','air conditioning','appliance repair',
    'roofing','flooring','tiling','handyman','furniture assembly','metalwork','welding','masonry','concrete','glass','aluminum',
    'electrical appliances install','interior design','water tank','water & sanitation','waste removal','solar','renewable energy',
    'locksmith','gardening','landscaping','pest control'
  ].some(has)) return 'repair';
  // Transport & Automotive
  if ([
    'automotive','car wash','detailing','car repair','motorcycle repair','transport & delivery','transport','delivery','boat','marine','moving'
  ].some(has)) return 'transport';
  // Creative / Marketing & Media
  if ([
    'graphic design','photography','videography','printing','branding','copywriting','advertising','packaging','label design',
    'digital marketing','social media marketing','seo','sem','paid ads','content marketing','email marketing','sms marketing',
    'affiliate marketing','pr & communications','market research','influencer marketing'
  ].some(has)) return 'creative';
  // Medical & Health
  if ([
    'medical','health','clinic','doctor','dent','pharmac','nurse'
  ].some(has)) return 'medical';
  // HR & Recruitment
  if ([
    'hr','recruit','hiring','human resources','staffing'
  ].some(has)) return 'hr';
  // Education
  if (['tutoring','education'].some(has)) return 'education';
  // Consulting / Professional services & Tech
  if ([
    'legal services','accounting','tax','insurance','real estate','architecture','engineering','internet & networking','web development',
    'translation','it & computer repair','mobile repair','satellite','tv','beauty & personal care','hair & makeup','fitness'
  ].some(has)) return 'consulting';
  // Sales & Retail
  if ([
    'retail & store','visual merchandising','point of sale','pos setup','storefront signage','shop interior design','inventory setup',
    'e-commerce setup','marketplace listings','sales'
  ].some(has)) return 'sales';
  // Crafts / Tailoring
  if (['tailoring','alterations','agriculture services'].some(has)) return 'crafts';
  return 'repair';
}
// Client-only react-leaflet components to avoid double-init in dev
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const locale = getClientLocale();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [mapMounted, setMapMounted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isRTL = locale === 'ar';
  const form = useForm<EditFormData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      priceMode: 'firm',
      showPriceInContact: false,
      acceptRequests: true,
      category: '',
      city: 'Tripoli',
      area: '',
      availabilityNote: '',
      contactPhone: '',
      contactWhatsapp: '',
      videoUrl: '',
      videoUrls: [],
      facebookUrl: '',
      telegramUrl: '',
      subservices: [],
    },
  });

  const titleValue = form.watch('title') as string;
  const descriptionValue = form.watch('description') as string;

  // Require sign-in to edit and load the service
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        variant: 'destructive',
        title: tr(locale, 'form.toasts.pleaseSignInTitle'),
        description: tr(locale, 'form.toasts.pleaseSignInDesc'),
      });
      router.push('/login');
      return;
    }
    (async () => {
      const id = params?.id;
      if (!id) return;
      const doc = await getServiceById(id);
      if (!doc) {
        router.push('/dashboard/services');
        return;
      }
      // Optional: Only allow the owner to edit
      if (user && (doc as Service).providerId && (doc as Service).providerId !== user.uid) {
        toast({
          variant: 'destructive',
          title: tr(locale, 'dashboard.serviceForm.notAllowedTitle'),
          description: tr(locale, 'dashboard.serviceForm.notAllowedDesc'),
        });
        router.push('/dashboard/services');
        return;
      }
      // Populate form with existing values
      form.reset({
        title: doc.title,
        description: doc.description,
        price: doc.price,
        priceMode: (doc as any).priceMode ?? 'firm',
        showPriceInContact: !!(doc as any).showPriceInContact,
        acceptRequests: (doc as any).acceptRequests !== false,
        category: (() => {
          const v = String((doc as any)?.category || '');
          const keys = Object.keys(CATEGORY_DEFS || {});
          return (keys as any).includes(v) ? v : mapCategoryToCardId(v);
        })(),
        city: doc.city,
        area: doc.area,
        availabilityNote: doc.availabilityNote ?? '',
        contactPhone: (doc as any).contactPhone ?? '',
        contactWhatsapp: (doc as any).contactWhatsapp ?? '',
        videoUrl: (doc as any).videoUrl ?? '',
        videoUrls: Array.isArray((doc as any).videoUrls) ? (doc as any).videoUrls : [],
        facebookUrl: (doc as any).facebookUrl ?? '',
        telegramUrl: (doc as any).telegramUrl ?? '',
        subservices: (doc as any).subservices ?? [],
      });
      setImages(doc.images ?? []);
      // Default to Tripoli center if missing
      const latVal = (doc as any).lat;
      const lngVal = (doc as any).lng;
      if (typeof latVal === 'number' && typeof lngVal === 'number') {
        setLat(latVal);
        setLng(lngVal);
      } else {
        setLat(32.8872);
        setLng(13.1913);
      }
      setLoading(false);
    })();
  }, [authLoading, user, params, form, router, toast, locale]);

  useEffect(() => {
    setMapMounted(true);
  }, []);

  // Leaflet marker icon (div-based to avoid asset issues)
  const markerIcon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.15)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = process.env.NEXT_PUBLIC_OSM_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Sub-services editing
  const subFieldArray = useFieldArray({ control: form.control, name: 'subservices' as const });
  const subWatch = form.watch('subservices') as any[] | undefined;
  const subTotal = (subWatch || []).reduce((sum, s) => sum + (Number(s?.price) || 0), 0);
  const priceModeValue = String(form.watch('priceMode') || 'firm');
  const isSales = String(form.watch('category') || '').toLowerCase().includes('sales');

  // Keep price synced to subservices total unless mode is 'call' or 'hidden'
  useEffect(() => {
    const mode = String(form.getValues('priceMode') || priceModeValue);
    const next = (mode === 'call' || mode === 'hidden') ? 0 : (Number.isFinite(subTotal) ? Number(subTotal) : 0);
    form.setValue('price', next, { shouldValidate: true });
  }, [subTotal, priceModeValue]);

  // Reverse geocode selected point to show human-readable address (free, cached)
  useEffect(() => {
    if (typeof lat !== 'number' || typeof lng !== 'number') { setSelectedAddress(''); return; }
    const ac = new AbortController();
    const lang = getLangFromDocument();
    reverseGeocodeNominatim(lat, lng, lang, ac.signal)
      .then((r) => {
        setSelectedAddress(r.displayName);
        try {
          const areaName = extractAreaFromDisplayName(r.displayName);
          if (areaName) form.setValue('area' as any, areaName, { shouldValidate: false });
        } catch {}
      })
      .catch((e) => {
        if ((e as any)?.name === 'AbortError') return;
        setSelectedAddress('');
      });
    return () => ac.abort();
  }, [lat, lng]);

  // Keep lat/lng synced to the map center when zooming or panning (edit form)
  function CenterWatcher() { return null; }

  function MapClickWatcher() {
    useMapEvents({
      click(e: any) {
        const { lat: la, lng: ln } = e?.latlng || {};
        if (typeof la === 'number' && typeof ln === 'number') {
          setLat(Number(la.toFixed(6)));
          setLng(Number(ln.toFixed(6)));
        }
      },
    });
    return null;
  }

  // --- Image helpers (match create form modes) ---
  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressToDataUrl(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
    const raw = await fileToDataUrl(file);
    const img = document.createElement('img');
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
      img.src = raw;
    });
    const scale = Math.min(1, maxWidth / (img.width || maxWidth));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((img.width || maxWidth) * scale);
    canvas.height = Math.round((img.height || maxWidth) * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  async function uploadImagesLocal(files: File[]): Promise<ServiceImage[]> {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    const res = await fetch('/api/uploads', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { urls: string[] };
    return (data.urls || []).map((u) => ({ url: u }));
  }

  async function uploadImagesCloudinary(files: File[]): Promise<ServiceImage[]> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) throw new Error('Cloudinary not configured');
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const out: ServiceImage[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', preset);
      const r = await fetch(endpoint, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const url: string = j.secure_url || j.url;
      const publicId: string | undefined = j.public_id;
      out.push({ url, ...(publicId ? { publicId } : {}) });
    }
    return out;
  }

  async function handleAddFiles(files: File[]) {
    if (files.length === 0) return;
    const mode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
    try {
      setUploading(true);
      let added: ServiceImage[] = [];
      if (mode === 'local') {
        added = await uploadImagesLocal(files);
      } else if (mode === 'cloudinary') {
        added = await uploadImagesCloudinary(files);
      } else if (mode === 'inline' || !mode || process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === '1' || process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === 'true') {
        const limited = files.slice(0, 4);
        const dataUrls = await Promise.all(limited.map((f) => compressToDataUrl(f)));
        added = dataUrls.map((u) => ({ url: u }));
      } else {
        if (!user?.uid) throw new Error('no_uid');
        added = await uploadServiceImages(user.uid, files);
      }
      setImages((prev) => [...prev, ...added]);
      toast({ title: tr(locale, 'form.toasts.imagesAdded') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'form.toasts.addImagesFailed'), description: e?.message || '' });
      try {
        const limited = files.slice(0, 4);
        const dataUrls = await Promise.all(limited.map((f) => compressToDataUrl(f)));
        const added = dataUrls.map((u) => ({ url: u }));
        setImages((prev) => [...prev, ...added]);
      } catch {}
    } finally {
      setUploading(false);
    }
  }

  async function handleReplaceFile(index: number, file: File) {
    const mode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
    try {
      setUploading(true);
      let next: ServiceImage;
      if (mode === 'local') {
        const [img] = await uploadImagesLocal([file]);
        next = img;
      } else if (mode === 'cloudinary') {
        const [img] = await uploadImagesCloudinary([file]);
        next = img;
      } else if (mode === 'inline' || !mode || process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === '1' || process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === 'true') {
        const url = await compressToDataUrl(file);
        next = { url } as ServiceImage;
      } else {
        if (!user?.uid) throw new Error('no_uid');
        const [img] = await uploadServiceImages(user.uid, [file]);
        next = img;
      }
      setImages((prev) => prev.map((it, i) => (i === index ? next : it)));
      toast({ title: tr(locale, 'form.toasts.imageReplaced') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'form.toasts.replaceFailed'), description: e?.message || '' });
      try {
        const url = await compressToDataUrl(file);
        const next = { url } as ServiceImage;
        setImages((prev) => prev.map((it, i) => (i === index ? next : it)));
      } catch {}
    } finally {
      setUploading(false);
    }
  }

  function handleReplaceUrl(index: number) {
    const url = window.prompt(tr(locale, 'form.images.pasteUrlPlaceholder'));
    if (!url) return;
    const v = String(url).trim();
    const isOk = /^https?:\/\//i.test(v)
      && (/(\.(jpe?g|png|webp)(\?.*)?$)/i.test(v) || /res\.cloudinary\.com|firebasestorage\.googleapis\.com/.test(v) || /^data:image\/(png|jpeg|webp);base64,/i.test(v));
    if (!isOk) {
      toast({ variant: 'destructive', title: tr(locale, 'form.images.urlInvalid') });
      return;
    }
    setImages((prev) => prev.map((it, i) => (i === index ? { url: v } : it)));
    toast({ title: tr(locale, 'form.toasts.imageReplaced') });
  }

  function moveImage(index: number, delta: number) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function removeImage(index: number) {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(tr(locale, 'form.images.confirmDelete'));
      if (!ok) return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddUrl() {
    const v = newImageUrl.trim();
    if (!v) return;
    const isOk = /^https?:\/\//i.test(v)
      && (/(\.(jpe?g|png|webp)(\?.*)?$)/i.test(v) || /res\.cloudinary\.com|firebasestorage\.googleapis\.com/.test(v) || /^data:image\/(png|jpeg|webp);base64,/i.test(v));
    if (!isOk) {
      setImageUrlError(tr(locale, 'form.images.urlInvalid'));
      return;
    }
    setImageUrlError('');
    setImages((prev) => [...prev, { url: v }]);
    setNewImageUrl('');
  }

  function handleUseMyLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast({ variant: 'destructive', title: tr(locale, 'form.geo.notAvailableTitle'), description: tr(locale, 'form.geo.notAvailableDesc') });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        setLat(la);
        setLng(ln);
        toast({ title: tr(locale, 'form.geo.setTitle'), description: `${la}, ${ln}` });
      },
      (err) => {
        toast({ variant: 'destructive', title: tr(locale, 'form.geo.couldNotGetTitle'), description: err?.message || tr(locale, 'form.geo.couldNotGetDesc') });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function onSubmit(data: EditFormData) {
    try {
      setSubmitting(true);
      const id = params?.id as string;
      const payload: any = {
        title: data.title,
        description: data.description,
        price: data.price,
        priceMode: (data as any).priceMode,
        showPriceInContact: !!(data as any).showPriceInContact,
        acceptRequests: !!(data as any).acceptRequests,
        category: data.category,
        city: data.city,
        availabilityNote: data.availabilityNote,
        images,
        subservices: data.subservices ?? [],
      };
      // Handle optional coordinates: set values if present; otherwise omit
      if (typeof lat === 'number') payload.lat = lat;
      if (typeof lng === 'number') payload.lng = lng;
      if (typeof data.videoUrl === 'string' && data.videoUrl.trim()) payload.videoUrl = data.videoUrl.trim();
      // Additional video links
      if (Array.isArray((data as any).videoUrls) && (data as any).videoUrls.filter(Boolean).length > 0) {
        payload.videoUrls = (data as any).videoUrls.filter((u: string) => typeof u === 'string' && u.trim() !== '');
      }
      // Social links
      if ((data as any).facebookUrl && (data as any).facebookUrl.trim()) payload.facebookUrl = (data as any).facebookUrl.trim();
      if ((data as any).telegramUrl && (data as any).telegramUrl.trim()) payload.telegramUrl = (data as any).telegramUrl.trim();

      if (typeof data.area === 'string' && data.area.trim()) {
        payload.area = data.area.trim();
      }
      if (typeof (data as any).contactPhone === 'string') {
        const v = (data as any).contactPhone.trim();
        if (v) payload.contactPhone = v;
      }
      if (typeof (data as any).contactWhatsapp === 'string') {
        const v = (data as any).contactWhatsapp.trim();
        if (v) payload.contactWhatsapp = v;
      }

      await updateService(id, payload);
      try {
        const after = await getServiceById(id);
        const n = Array.isArray((after as any)?.images) ? (after as any).images.length : 0;
        toast({ title: tr(locale, 'form.toasts.updateSuccess'), description: `${n} image(s) saved` });
      } catch {}
      router.push(`/services/${id}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: tr(locale, 'form.toasts.updateFailedTitle'), description: err?.message || '' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">{tr(locale, 'dashboard.services.loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{tr(locale, 'dashboard.serviceForm.editTitle')}</CardTitle>
          <CardDescription>{tr(locale, 'dashboard.serviceForm.editSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr(locale, 'form.labels.title')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <div className="mt-1 text-xs text-muted-foreground">{(form.watch('title')?.length || 0)}/100 · {locale === 'ar' ? 'الحد الأدنى 6 أحرف' : 'min 6 chars'}</div>
                
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr(locale, 'form.labels.description')}</FormLabel>
                <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                <div className="mt-1 text-xs text-muted-foreground">{(form.watch('description')?.length || 0)} {locale === 'ar' ? 'حرف' : 'chars'}</div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{tr(locale, 'form.labels.category')}</FormLabel>
                  <CategoryCards
                    locale={locale}
                    selectedId={String(field.value || '')}
                    onSelect={(id) => field.onChange(id)}
                  />
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-3">
                <FormField control={form.control} name="priceMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr(locale, 'form.labels.priceMode')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'firm'}>
                      <FormControl><SelectTrigger><SelectValue placeholder={tr(locale, 'form.labels.priceMode')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="firm">{locale === 'ar' ? 'ثابت' : 'Firm'}</SelectItem>
                        <SelectItem value="negotiable">{locale === 'ar' ? 'قابل للتفاوض' : 'Negotiable'}</SelectItem>
                        <SelectItem value="call">{locale === 'ar' ? 'اتصل بي' : 'Call me'}</SelectItem>
                        <SelectItem value="hidden">{locale === 'ar' ? 'إخفاء السعر' : 'Hide price'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="text-sm font-medium">{isSales ? (locale === 'ar' ? 'المبيعات' : 'Sales') : tr(locale, 'form.subservices.titlePlural')}</div>
                {subFieldArray.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">{isSales ? (locale === 'ar' ? 'لا توجد مبيعات' : 'No sales yet.') : tr(locale, 'form.subservices.empty')}</p>
                )}
                {subFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="rounded border p-3 space-y-2">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <FormField control={form.control} name={`subservices.${index}.title` as const} render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isSales ? (locale === 'ar' ? 'عنوان المنتج' : 'Product title') : tr(locale, 'form.subservices.title')}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`subservices.${index}.price` as const} render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isSales ? (locale === 'ar' ? 'سعر البيع' : 'Sale price') : tr(locale, 'form.subservices.price')}</FormLabel>
                          <FormControl><Input type="number" min={0} step="1" placeholder="50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`subservices.${index}.unit` as const} render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.subservices.unit')}</FormLabel><FormControl><Input placeholder={tr(locale, 'form.subservices.unitPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="flex items-end"><Button type="button" variant="outline" onClick={() => subFieldArray.remove(index)}>{isSales ? (locale === 'ar' ? 'إزالة بيع' : 'Remove sale') : tr(locale, 'form.subservices.remove')}</Button></div>
                    </div>
                    <FormField control={form.control} name={`subservices.${index}.description` as const} render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.subservices.description')}</FormLabel><FormControl><Textarea rows={2} placeholder={tr(locale, 'form.subservices.descriptionPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm"><div className="text-muted-foreground">{tr(locale, 'form.subservices.total')}</div><div className="font-semibold">LYD {Number.isFinite(subTotal) ? subTotal : 0}</div></div>
                <Button
                  type="button"
                  variant="secondary"
                  className="font-bold text-red-600 hover:text-red-700 text-base md:text-lg"
                  onClick={() => subFieldArray.append({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: '', price: 0, unit: '', description: '' })}
                >
                  + {isSales ? (locale === 'ar' ? 'إضافة بيع' : 'Add sale') : tr(locale, 'form.subservices.add')}
                </Button>

                {(priceModeValue !== 'call' && priceModeValue !== 'hidden') && (
                  <>
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.price')}</FormLabel>
                        <FormControl><Input type="number" readOnly {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="showPriceInContact" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} id="edit_showPriceInContact" />
                          <FormLabel htmlFor="edit_showPriceInContact" className="!mt-0">{tr(locale, 'form.labels.showPriceInContact')}</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
              </div>
            </div>

            <FormField control={form.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.videoUrl')}</FormLabel><FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="space-y-2">
              <FormLabel>{tr(locale, 'form.labels.videoUrls')}</FormLabel>
              <div className="space-y-2">
                {(form.watch('videoUrls') as any[] || []).map((url: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={url} onChange={(e) => { const next = [...((form.getValues('videoUrls') as any[]) || [])]; next[idx] = e.target.value; form.setValue('videoUrls' as any, next, { shouldValidate: true }); }} placeholder="https://www.youtube.com/watch?v=..." />
                    <Button type="button" variant="outline" onClick={() => { const next = ((form.getValues('videoUrls') as any[]) || []).filter((_, i) => i !== idx); form.setValue('videoUrls' as any, next, { shouldValidate: true }); }}>{tr(locale, 'form.subservices.remove')}</Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="https://www.youtube.com/watch?v=..." value={(form as any)._newVideoUrl || ''} onChange={(e) => ((form as any)._newVideoUrl = e.target.value)} />
                <Button type="button" variant="secondary" onClick={() => { const v = String((form as any)._newVideoUrl || '').trim(); if (!v) return; const next = [...((form.getValues('videoUrls') as any[]) || []), v]; form.setValue('videoUrls' as any, next, { shouldValidate: true }); (form as any)._newVideoUrl = ''; }}>+ Add</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FormField control={form.control} name="facebookUrl" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.facebookUrl')}</FormLabel><FormControl><Input placeholder="https://facebook.com/yourpage" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="telegramUrl" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.telegramUrl')}</FormLabel><FormControl><Input placeholder="https://t.me/yourchannel" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr(locale, 'form.labels.city')}</FormLabel>
                  <FormControl>
                    <CityPicker
                      locale={locale}
                      value={field.value}
                      options={libyanCities}
                      onChange={(v) => { field.onChange(v); const c = cityCenter(v); if (c) { setLat(c.lat); setLng(c.lng); } }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.area')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <FormField control={form.control} name="availabilityNote" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.availabilityNote')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.contactPhone')}</FormLabel><FormControl><Input placeholder={tr(locale, 'form.placeholders.contactPhone')} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactWhatsapp" render={({ field }) => (<FormItem><FormLabel>{tr(locale, 'form.labels.contactWhatsapp')}</FormLabel><FormControl><Input placeholder={tr(locale, 'form.placeholders.contactWhatsapp')} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <FormField control={form.control} name="acceptRequests" render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} id="edit_acceptRequests" />
                  <FormLabel htmlFor="edit_acceptRequests" className="!mt-0">{locale === 'ar' ? 'السماح بطلب الخدمة داخل التطبيق' : 'Allow in-app service requests'}</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <Card>
              <CardContent className="space-y-3">
                <FormLabel>{tr(locale, 'form.labels.pickLocation')}</FormLabel>
                {mapMounted && (
                  <div className="h-64 w-full overflow-hidden rounded border">
                    <MapContainer key={`${lat ?? 'city'}-${lng ?? 'city'}`} center={(lat != null && lng != null) ? [lat, lng] : (() => { const c = cityCenter(String(form.getValues('city') || '')); return [c?.lat ?? 32.8872, c?.lng ?? 13.1913] as [number, number]; })()} zoom={13} className="h-full w-full cursor-crosshair" scrollWheelZoom={true} whenReady={(e: any) => { setTimeout(() => e.target.invalidateSize(), 0); }} onClick={(e: any) => { const { lat: la, lng: ln } = e.latlng || {}; if (typeof la === 'number' && typeof ln === 'number') { setLat(Number(la.toFixed(6))); setLng(Number(ln.toFixed(6))); } }}>
                      <CenterWatcher />
                      <MapClickWatcher />
                      <TileLayer attribution={tileAttrib} url={tileUrl} />
                      <ScaleControl position="bottomleft" />
                      {(lat != null && lng != null) && (<Marker position={[lat, lng] as any} draggable={true} icon={markerIcon as any} eventHandlers={{ dragend: (e: any) => { const p = e.target.getLatLng(); setLat(Number(p.lat.toFixed(6))); setLng(Number(p.lng.toFixed(6))); } }}><Popup>{tr(locale, 'form.map.selected')}</Popup></Marker>)}
                    </MapContainer>
                    <div className="px-2 py-1 text-xs text-muted-foreground">{lat != null && lng != null ? (<span>{tr(locale, 'form.map.selected')}: {lat.toFixed(6)}, {lng.toFixed(6)}{selectedAddress ? ` — ${selectedAddress}` : ''}</span>) : (<span>{tr(locale, 'form.map.clickToSet')}</span>)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <FormLabel className={isRTL ? 'text-right' : ''}>{tr(locale, 'form.images.label')}</FormLabel>
                <div className={`flex flex-col gap-2 sm:items-center sm:gap-3 ${isRTL ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddFiles(Array.from(e.target.files ?? []))} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label={tr(locale, 'form.images.addFiles')}>{tr(locale, 'form.images.addFiles')}</Button>
                  <div className={`flex w-full sm:w-auto items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input className="w-full sm:w-72" placeholder={tr(locale, 'form.images.pasteUrlPlaceholder')} value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} aria-label={tr(locale, 'form.images.pasteUrlPlaceholder')} />
                    <Button type="button" variant="outline" onClick={handleAddUrl} disabled={uploading} aria-label={tr(locale, 'form.images.addUrl')}>{tr(locale, 'form.images.addUrl')}</Button>
                  </div>
                  <div className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{tr(locale, 'form.images.helper')}</div>
                  {imageUrlError && (<div className={`text-xs text-destructive ${isRTL ? 'text-right' : ''}`}>{imageUrlError}</div>)}
                </div>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative overflow-hidden rounded border">
                        {/^data:|^blob:/i.test(String(img.url)) ? (
                          <img src={String(img.url)} alt={`Image ${i + 1}`} className="aspect-square w-full object-cover" />
                        ) : (
                          <Image src={img.url} alt={`Image ${i + 1}`} width={400} height={300} className="aspect-square w-full object-cover" />
                        )}
                        <div className={`flex items-center justify-between gap-2 p-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => moveImage(i, -1)} aria-label={tr(locale, 'form.images.moveUp')}><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => moveImage(i, +1)} aria-label={tr(locale, 'form.images.moveDown')}><ArrowDown className="h-4 w-4" /></button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" size="sm" aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                              <DropdownMenuItem onSelect={() => setTimeout(() => document.getElementById(`replace-file-${i}`)?.click(), 0)}><Pencil className="h-4 w-4" /> {tr(locale, 'form.images.replace')}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleReplaceUrl(i)}><LinkIcon className="h-4 w-4" /> {tr(locale, 'form.images.replaceUrl')}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => removeImage(i)} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> {tr(locale, 'form.images.remove')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <input id={`replace-file-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceFile(i, f); e.currentTarget.value = ''; }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{tr(locale, 'form.images.none')}</p>
                )}
              </CardContent>
            </Card>

            <div className="sticky bottom-0 z-10 -mb-6 mt-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
              <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <Button type="submit" disabled={submitting}>{submitting ? tr(locale, 'dashboard.serviceForm.saving') : tr(locale, 'dashboard.serviceForm.saveChanges')}</Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  </div>
);
}
