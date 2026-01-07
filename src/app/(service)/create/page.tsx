"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import L from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

import { serviceSchema, type ServiceFormData } from "@/lib/schemas";
import { getClientLocale, tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { libyanCities, cityLabel, cityCenter } from "@/lib/cities";
import { createService, uploadServiceImages, updateService, getServiceById } from "@/lib/services";
import type { Service } from "@/lib/service-types";
import { getServiceDraft, saveServiceDraft, deleteServiceDraft } from "@/lib/service-drafts";
import { tileUrl, tileAttribution, markerHtml } from "@/lib/map";
import { reverseGeocodeNominatim, getLangFromDocument } from "@/lib/geocode";
import { CategoryCards, CATEGORY_DEFS } from "@/components/category-cards";
import { transformCloudinary } from "@/lib/images";
import CityPicker from "@/components/city-picker";

// -------------------- NEW HELPERS (ADD) --------------------
function isHttpUrl(u?: string) {
  try { const x = new URL(String(u)); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
}

async function uploadToCloudinary(files: File[]): Promise<string[]> {
  const cloud = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || "");
  const preset = (process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "");
  if (!cloud || !preset) throw new Error('Cloudinary env missing (cloud/preset)');

  const urls: string[] = [];
  for (const f of files) {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('upload_preset', preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload`, {
      method: 'POST',
      body: fd
    });

    // Try to read JSON safely (Cloudinary always returns JSON on errors)
    let body: any = null;
    try { body = await res.json(); } catch { /* ignore */ }

    if (!res.ok) {
      const msg =
        (body && (body.error?.message || body.message)) ||
        `HTTP ${res.status}`;
      throw new Error(`Cloudinary upload failed: ${msg}`);
    }

    const url = body?.secure_url;
    if (!url) throw new Error('Cloudinary response missing secure_url');
    urls.push(url);
  }
  return urls;
}


// STRICT: only allow "cloudinary" when BOTH vars are present
function getUploadMode(uid?: string | null) {
  const envMode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || "").toLowerCase();
  const hasCloud = !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD);
  const hasPreset = !!process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
  const storageDisabled =
    process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === "1" ||
    process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === "true";

  // explicit modes
  if (envMode === "inline") return "inline";
  if (envMode === "local") return "local";
  if (envMode === "cloudinary") return (hasCloud && hasPreset) ? "cloudinary" : "inline";
  if (envMode === "storage")  return storageDisabled ? "inline" : "storage";

  // default behavior
  if (uid) {
    // prefer storage for signed-in users unless disabled
    return storageDisabled ? ((hasCloud && hasPreset) ? "cloudinary" : "inline") : "storage";
  }
  // no uid yet → only use cloudinary if fully configured, else inline preview
  return (hasCloud && hasPreset) ? "cloudinary" : "inline";
}




async function dataUrlToFile(dataUrl: string, name = `image_${Date.now()}.jpg`): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}
// -----------------------------------------------------------

// Client-only react-leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

// Helper: compress File to JPEG data URL (approx width 800)
async function compressToDataUrl(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = document.createElement('img');
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = raw; });
  const scale = Math.min(1, maxWidth / (img.width || maxWidth));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((img.width || maxWidth) * scale);
  canvas.height = Math.round((img.height || maxWidth) * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function urlForPreview(raw: string): string {
  try {
    const u = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (u.hostname === 'res.cloudinary.com') {
      return transformCloudinary(u.toString(), { w: 800, q: 'auto' });
    }
  } catch {}
  return raw;
}

function isHeic(file: File): boolean {
  try {
    const name = String((file as any)?.name || '').toLowerCase();
    const type = String((file as any)?.type || '').toLowerCase();
    return type.includes('heic') || type.includes('heif') || /\.(heic|heif)$/.test(name);
  } catch {
    return false;
  }
}

function makeObjectUrl(file: File): string | undefined {
  try { return URL.createObjectURL(file); } catch { return undefined; }
}

function revokeIfBlob(u?: string) {
  try { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); } catch {}
}

// Step schemas
const catSchema = z.object({ category: serviceSchema.shape.category });
const detailsStepSchema = z.object({
  title: serviceSchema.shape.title,
  description: serviceSchema.shape.description,
});
const mediaSchema = z.object({
  images: serviceSchema.shape.images,
  videoUrl: serviceSchema.shape.videoUrl.optional(),
  videoUrls: serviceSchema.shape.videoUrls.optional(),
});
const pricingSchema = z.object({ price: serviceSchema.shape.price, priceMode: serviceSchema.shape.priceMode, subservices: serviceSchema.shape.subservices });
const locationSchema = z.object({
  location: serviceSchema.shape.location,
  city: serviceSchema.shape.city,
  area: serviceSchema.shape.area,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function CreateServiceWizardPage() {
  const { user, userProfile, loading } = useAuth();
  const uid = user?.uid;
  const locale = getClientLocale();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (userProfile?.role !== 'provider') { router.replace('/'); }
  }, [loading, user, userProfile?.role, router]);

  const { toast } = useToast();

  // Warn only when Cloudinary mode is selected but required env vars are missing.
  useEffect(() => {
    const mode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
    const hasCloud =
      !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD);
    const hasPreset = !!process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

    if (mode === 'cloudinary' && (!hasCloud || !hasPreset)) {
      console.warn(
        '[CreateService] Cloudinary mode selected but env is incomplete. ' +
          'Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD) ' +
          'and NEXT_PUBLIC_CLOUDINARY_PRESET.'
      );
    }
  }, []);

  const form = useForm<ServiceFormData>({

    resolver: zodResolver(serviceSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: libyanCities[0]?.value ?? "Tripoli",
      area: "",
      price: 0,
      priceMode: 'firm',
      showPriceInContact: false,
      acceptRequests: true,
      subservices: [],
      location: { lat: 32.8872, lng: 13.1913 },
      images: [],
      youtubeUrl: "",
      videoUrls: [],
      availabilityNote: "",
      contactPhone: "",
      contactWhatsapp: "",
      mapUrl: "",
      facebookUrl: "",
      telegramUrl: "",
    },
  });


  const [step, setStep] = useState<Step>(1);
  const subFieldArray = useFieldArray({ control: form.control, name: "subservices" });
  // Keep images in local state and sync to form
  const [imagesState, setImagesState] = useState<{ url: string; displayUrl?: string }[]>(form.getValues('images') || [] as any);
  useEffect(() => {
    form.setValue('images', imagesState, { shouldValidate: true });
  }, [imagesState, form]);

  useEffect(() => {
    return () => {
      try { (imagesState || []).forEach((it) => revokeIfBlob(it.displayUrl)); } catch {}
    };
  }, []);

  const wiz = useMemo(() => {
    return {
      title: tr(locale, 'wizard.title'),
      subtitle: tr(locale, 'wizard.subtitle5'),
      category: tr(locale, 'wizard.steps.category'),
      location: tr(locale, 'wizard.steps.location'),
      details: tr(locale, 'wizard.steps.details'),
      media: tr(locale, 'wizard.steps.media'),
      pricing: tr(locale, 'wizard.steps.pricing'),
      confirm: tr(locale, 'wizard.steps.confirm'),
      reviewHint: tr(locale, 'wizard.reviewHint'),
      finish: tr(locale, 'wizard.finish'),
    };
  }, [locale]);

  // Auto-calc total price
  const subsForCalc: any[] = form.watch('subservices') || [];
  const priceModeValue: string = String(form.watch('priceMode') || 'firm');
  const computedTotal = useMemo(() => {
    try {
      const arr = Array.isArray(subsForCalc) ? subsForCalc : [];
      return arr.reduce((sum: number, it: any) => sum + Number(it?.price || 0), 0);
    } catch { return 0; }
  }, [JSON.stringify(subsForCalc)]);
  useEffect(() => {
    const arr = Array.isArray(subsForCalc) ? subsForCalc : [];
    if (arr.length > 0) {
      const eff = (priceModeValue === 'call' || priceModeValue === 'hidden') ? 0 : computedTotal;
      form.setValue('price', eff, { shouldValidate: true });
    }
  }, [computedTotal, priceModeValue, subsForCalc]);

  // Load existing draft
  useEffect(() => {
    let cancelled = false;
    if (!uid) return;
    getServiceDraft(uid).then((draft) => {
      if (cancelled || !draft) return;
      const entries = Object.entries(draft) as [keyof ServiceFormData, any][];
      for (const [k, v] of entries) {
        if (v !== undefined) form.setValue(k, v as any, { shouldValidate: false });
      }
    });
    return () => { cancelled = true; };
  }, [uid]);

  // Derived map/icon
  const markerIcon = useMemo(() => L.divIcon({ className: '', html: markerHtml, iconSize: [20,20], iconAnchor: [10,10] }), []);
  const lat = (form.watch("location.lat") as any) as number | undefined;
  const lng = (form.watch("location.lng") as any) as number | undefined;
  const latNum = typeof lat === 'number' ? lat : (lat ? Number(lat) : undefined);
  const lngNum = typeof lng === 'number' ? lng : (lng ? Number(lng) : undefined);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [userSetLocation, setUserSetLocation] = useState(false);

  function MapClickWatcher() {
    useMapEvents({
      click(e: any) {
        const { lat, lng } = e?.latlng || {};
        if (typeof lat === 'number' && typeof lng === 'number') {
          form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true });
          form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true });
          setUserSetLocation(true);
        }
      }
    });
    return null;
  }

  function RecenterOnMarker({ lat, lng }: { lat?: number; lng?: number }) {
    const map = useMap();
    useEffect(() => {
      if (typeof lat === 'number' && typeof lng === 'number') {
        try { map.setView([lat, lng]); } catch {}
      }
    }, [lat, lng, map]);
    return null;
  }

  function extractAreaFromDisplayName(name: string): string {
    try {
      const parts = String(name || '').split(/،|,/).map((p) => p.trim()).filter(Boolean);
      return parts[0] || '';
    } catch {
      return '';
    }
  }

  useEffect(() => {
    if (latNum == null || lngNum == null) { setSelectedAddress(''); return; }
    const ac = new AbortController();
    const lang = getLangFromDocument();
    reverseGeocodeNominatim(latNum, lngNum, lang, ac.signal)
      .then((r) => {
        setSelectedAddress(r.displayName);
        if (userSetLocation) {
          try {
            const areaName = extractAreaFromDisplayName(r.displayName);
            if (areaName) form.setValue('area', areaName, { shouldValidate: true });
            const dn = r.displayName || '';
            const found = libyanCities.find((c) => dn.includes(c.ar) || dn.toLowerCase().includes(String(c.value).toLowerCase()));
            if (found) form.setValue('city', found.value, { shouldValidate: true });
          } catch {}
        }
      })
      .catch((e) => {
        if ((e as any)?.name === 'AbortError') return;
        setSelectedAddress('');
      });
    return () => ac.abort();
  }, [latNum, lngNum, form, userSetLocation]);

  // When entering Step 3, if address is empty, prefill
  useEffect(() => {
    if (step !== 3) return;
    const current = String(form.getValues('location.address') || '').trim();
    if (current) return;
    const area = String(form.getValues('area') || '').trim();
    const city = String(form.getValues('city') || '').trim();
    const composed = [area, city].filter(Boolean).join(', ');
    if (composed) form.setValue('location.address', composed, { shouldValidate: false });
  }, [step, form]);

  // Save draft helper
  const persistDraft = async () => {
    if (!uid) return;
    const values = form.getValues();
    await saveServiceDraft(uid, values);
  };

  const goNext = async () => {
    const fieldsByStep: Record<Step, (keyof ServiceFormData)[]> = {
      1: ["category"],
      2: ["title", "description"],
      3: ["city", "area", "availabilityNote", "contactPhone", "contactWhatsapp", "facebookUrl" as any, "telegramUrl" as any, "location" as any],
      4: ["images" as any, "videoUrl" as any, "videoUrls" as any],
      5: ["price", "subservices"],
      6: [],
    };
    const fields = fieldsByStep[step];
    if (fields.length) {
      const ok = await form.trigger(fields as any, { shouldFocus: true });
      if (!ok) {
        const err = form.formState.errors as any;
        const firstKey = Object.keys(err)[0] as keyof ServiceFormData | undefined;
        if (firstKey) form.setFocus(firstKey as any);
        return;
      }
    }
    // If user selected Sales & Trade in category step, redirect to dedicated sales create flow
    if (step === 1) {
      const v = String(form.getValues('category') || '').toLowerCase();
      if (v === 'sales') {
        router.push('/sales/create');
        return;
      }
    }
    await persistDraft();
    setStep((s): Step => (s >= 6 ? 6 : ((s + 1) as Step)));
  };

  const goPrev = async () => {
    await persistDraft();
    setStep((s) => {
      if (s === 1) {
        router.push('/dashboard/services');
        return s as Step;
      }
      return ((s - 1) as Step);
    });
  };

  const disableNext = useMemo(() => {
    if (step === 1) return !catSchema.safeParse(form.watch()).success;
    if (step === 2) return !detailsStepSchema.safeParse(form.watch()).success;
    if (step === 3) return !locationSchema.safeParse(form.watch()).success;
    if (step === 4) return !mediaSchema.safeParse(form.watch()).success;
    if (step === 5) return !pricingSchema.safeParse(form.watch()).success;
    return false;
  }, [step, form.watch()]);

  const handleFinish = async () => {
    if (!uid) return;
    const valid = await form.trigger(undefined, { shouldFocus: true });
    if (!valid) return;

    let imgs = (form.getValues('images') || []) as { url: string; displayUrl?: string }[];
    const mode = getUploadMode(uid);
    if (mode === 'cloudinary') {
      const dataUrls = imgs.filter((x) => !isHttpUrl(x.url));
      if (dataUrls.length > 0) {
        try {
          const files = await Promise.all(dataUrls.map((x, i) => dataUrlToFile(x.url, `img_${Date.now()}_${i}.jpg`)));
          const urls = await uploadToCloudinary(files);
          let idx = 0;
          imgs = imgs.map((x) => (isHttpUrl(x.url) ? x : { url: urls[idx++], displayUrl: x.displayUrl }));
          form.setValue('images', imgs, { shouldValidate: true });
        } catch (e) {
          toast({ variant: 'destructive', title: tr(locale, 'form.toasts.addImagesFailed') });
          return;
        }
      }
    }

    const values = form.getValues();
    const payload = {
      title: values.title,
      description: values.description,
      price: values.price,
      priceMode: values.priceMode,
      showPriceInContact: values.showPriceInContact,
      acceptRequests: values.acceptRequests,
      category: values.category,
      city: values.city,
      area: values.area ?? '',
      availabilityNote: values.availabilityNote,
      mapUrl: values.mapUrl,
      contactPhone: values.contactPhone,
      contactWhatsapp: values.contactWhatsapp,
      videoUrl: values.youtubeUrl || values.videoUrl,
      videoUrls: Array.isArray(values.videoUrls) ? values.videoUrls.filter(Boolean) : undefined,
      facebookUrl: values.facebookUrl,
      telegramUrl: values.telegramUrl,
      images: (imgs || []).map((it) => ({ url: it.url })),
      subservices: values.subservices ?? [],
      lat: values.location?.lat,
      lng: values.location?.lng,
      providerId: uid,
      providerName: user?.displayName ?? null,
      providerEmail: user?.email ?? null,
    } satisfies Omit<Service, 'id' | 'createdAt'>;

    try {
      const id = await createService(payload);
      // Ensure images stick even if API trims
      if (Array.isArray(payload.images) && payload.images.length > 0) {
        try { await updateService(id, { images: payload.images }); } catch {}
      }
      try {
        const doc = await getServiceById(id);
        const n = Array.isArray((doc as any)?.images) ? (doc as any).images.length : 0;
        toast({ title: locale === 'ar' ? 'تم إنشاء الخدمة' : 'Service created', description: `${n} image(s) saved` });
      } catch {}
      await deleteServiceDraft(uid);
      router.push(`/services/${id}`);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: locale === 'ar' ? 'فشل إنشاء الخدمة' : 'Failed to create service' });
    }
  };

  const Stepper = () => (
    <div className="mb-4 flex items-center gap-2 text-sm">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold" : "text-muted-foreground"}`}>
          <div className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {n}
          </div>
          <span>
            {n === 1 ? wiz.category : n === 2 ? wiz.details : n === 3 ? wiz.location : n === 4 ? wiz.media : n === 5 ? wiz.pricing : wiz.confirm}
          </span>
          {n < 6 && <span className="mx-2 text-muted-foreground">›</span>}
        </div>
      ))}
    </div>
  );

  if (loading || !user || userProfile?.role !== 'provider') return null;

  return (
<div className="mx-auto max-w-3xl pt-16 md:pt-20">
      <Card>
        
        <CardHeader>
          <CardTitle>{wiz.title}</CardTitle>
          <CardDescription>{wiz.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Stepper />
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{wiz.category}</FormLabel>
                        <CategoryCards locale={locale} selectedId={String(field.value || "")} onSelect={(id) => field.onChange(id)} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <Card>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, "form.labels.title")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, "form.labels.description")}</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <div className="mt-1 text-xs text-muted-foreground">{(form.watch('description')?.length || 0)} {locale === 'ar' ? 'حرف' : 'chars'}</div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, "form.labels.price")}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={1} value={Number(field.value ?? 0)} onChange={(e)=>field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, "form.labels.city")}</FormLabel>
                            <FormControl>
                              <CityPicker
                                locale={locale}
                                value={field.value}
                                options={libyanCities}
                                onChange={(v) => {
                                  field.onChange(v);
                                  // When user manually changes city, clear auto-detected area
                                  // and treat it as a new manual choice (disable auto area until map is used again).
                                  form.setValue('area', '', { shouldValidate: true });
                                  setUserSetLocation(false);
                                  const center = cityCenter(v);
                                  if (center) {
                                    form.setValue('location.lat', Number(center.lat.toFixed(6)), { shouldValidate: true });
                                    form.setValue('location.lng', Number(center.lng.toFixed(6)), { shouldValidate: true });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, "form.labels.area")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>{tr(locale, 'form.labels.pickLocation')}</FormLabel>
                      <div className="relative z-0 overflow-hidden rounded-[14px] border-2 border-[#D97800] bg-background p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                        <MapContainer center={[latNum ?? 32.8872, lngNum ?? 13.1913]} zoom={13} scrollWheelZoom={false} attributionControl={false} className="cursor-crosshair rounded-md" style={{ height: 220, width: '100%'}}
                          onClick={(e: any) => {
                            const { lat, lng } = e?.latlng || {};
                            if (typeof lat === 'number' && typeof lng === 'number') {
                              form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true });
                              form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true });
                            }
                          }}
                          whenCreated={(map: any) => {
                            const update = () => {
                              const c = map.getCenter();
                              form.setValue('location.lat', Number(c.lat.toFixed(6)), { shouldValidate: true });
                              form.setValue('location.lng', Number(c.lng.toFixed(6)), { shouldValidate: true });
                            };
                            map.on('moveend', update);
                            map.on('zoomend', update);
                          }}
                        >
                          <TileLayer url={tileUrl} attribution={tileAttribution} />
                          <RecenterOnMarker lat={latNum} lng={lngNum} />
                          <MapClickWatcher />
                          {latNum != null && lngNum != null && (
                            <Marker position={[latNum, lngNum]} icon={markerIcon} draggable={true}
                              eventHandlers={{
                                dragend: (e: any) => {
                                  const m = e?.target;
                                  if (m?.getLatLng) {
                                    const p = m.getLatLng();
                                    form.setValue('location.lat', Number(p.lat.toFixed(6)), { shouldValidate: true });
                                    form.setValue('location.lng', Number(p.lng.toFixed(6)), { shouldValidate: true });
                                    setUserSetLocation(true);
                                  }
                                }
                              }}
                            >
                              <Popup>{selectedAddress || tr(locale, 'form.map.selected')}</Popup>
                            </Marker>
                          )}
                          <ScaleControl imperial={false} position="bottomleft" />
                        </MapContainer>
                        <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-[#555] opacity-50">
                          @ Khidmaty & CloudAI Academy
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="contactPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, 'form.labels.contactPhone')}</FormLabel>
                          <FormControl><Input placeholder={tr(locale, 'form.placeholders.contactPhone') as string} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contactWhatsapp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, 'form.labels.contactWhatsapp')}</FormLabel>
                          <FormControl><Input placeholder={tr(locale, 'form.placeholders.contactWhatsapp') as string} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="acceptRequests" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} id="create_acceptRequests" />
                          <FormLabel htmlFor="create_acceptRequests" className="!mt-0">{locale === 'ar' ? 'السماح بطلب الخدمة داخل التطبيق' : 'Allow in-app service requests'}</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="availabilityNote" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, 'form.labels.availabilityNote')}</FormLabel>
                          <FormControl><Textarea rows={2} placeholder={tr(locale, 'form.placeholders.availability') as string} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, 'form.labels.facebookUrl')}</FormLabel>
                            <FormControl><Input type="url" placeholder="https://facebook.com/yourpage" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="telegramUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, 'form.labels.telegramUrl')}</FormLabel>
                            <FormControl><Input type="url" placeholder="https://t.me/yourchannel" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel>{tr(locale, 'form.labels.images')}</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={getUploadMode(uid) === 'storage' && !uid}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (!files.length) return;
                          const mode = getUploadMode(uid);
                          try {
                            let mapped: { url: string; displayUrl?: string }[] = [];
                            const heic = files.filter((f) => isHeic(f));
                            const rest = files.filter((f) => !isHeic(f));
                            // HEIC/HEIF: convert to JPEG data URLs for preview; upload only in cloudinary mode
                            if (heic.length > 0) {
                              const limitedHeic = heic.slice(0, 4);
                              const heicDataUrls = await Promise.all(limitedHeic.map((f) => compressToDataUrl(f, 800, 0.6)));
                              if (mode === 'cloudinary') {
                                const heicFiles = await Promise.all(heicDataUrls.map((u, i) => dataUrlToFile(u, `heic_${Date.now()}_${i}.jpg`)));
                                const heicUrls = await uploadToCloudinary(heicFiles);
                                mapped.push(...heicUrls.map((u, i) => ({ url: u, displayUrl: heicDataUrls[i] })));
                              } else {
                                mapped.push(...heicDataUrls.map((u) => ({ url: u, displayUrl: u })));
                              }
                            }
                            if (rest.length > 0) {
                              if (mode === 'inline') {
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 800, 0.6)));
                                mapped.push(...previews.map((u) => ({ url: u, displayUrl: u })));
                              } else if (mode === 'local') {
                                const fd = new FormData();
                                rest.forEach((f) => fd.append('files', f));
                                const res = await fetch('/api/uploads', { method: 'POST', body: fd });
                                if (!res.ok) throw new Error('local_upload_failed');
                                const data = await res.json();
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                const urls = (data.urls || []) as string[];
                                mapped.push(...urls.map((u, i) => ({ url: u, displayUrl: previews[i] || undefined })));
                              } else if (mode === 'cloudinary') {
                                const urls = await uploadToCloudinary(rest as File[]);
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                mapped.push(...urls.map((u, i) => ({ url: u, displayUrl: previews[i] || undefined })));
                              } else {
                                // 'storage' (Firebase)
                                if (!uid) throw new Error('no_uid');
                                const uploaded = await uploadServiceImages(uid, rest as File[]);
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                mapped.push(...uploaded.map((u, i) => ({ url: u.url, displayUrl: previews[i] || undefined })));
                              }
                            }
                            const prev = imagesState || [];
                            const next = [...prev, ...mapped];
                            setImagesState(next);
                            await persistDraft();
                          } catch (err: any) {
                            const msg = (err?.message || String(err || '')).slice(0, 300);
                            toast({
                              variant: 'destructive',
                              title: tr(locale, 'form.toasts.addImagesFailed'),
                              description: msg,
                            });
                            // Optional fallback previews so user still sees something; submit-time safety will re-upload these.
                            try {
                              const limited = files.slice(0, 2);
                              const dataUrls = await Promise.all(limited.map((f) => compressToDataUrl(f, 800, 0.6)));
                              const mapped = dataUrls.map((u) => ({ url: u, displayUrl: u }));
                              const prev = imagesState || [];
                              const next = [...prev, ...mapped];
                              setImagesState(next);
                              await persistDraft();
                            } catch {
                              // keep silent
                            }
                          }
                        }}
                      />
                      {Array.isArray(imagesState) && imagesState.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-4">
                          {imagesState.map((img, i) => (
                            <div key={`${img.url}_${i}`} className="relative">
                              <img
                                src={img.displayUrl || urlForPreview(img.url)}
                                alt=""
                                className="h-24 w-full rounded object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = img.displayUrl || 'https://placehold.co/800x600.png'; }}
                              />
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
                                onClick={() => {
                                  try { revokeIfBlob(imagesState[i]?.displayUrl); } catch {}
                                  const next = (imagesState || []).filter((_, idx) => idx !== i);
                                  setImagesState(next);
                                }}
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormField control={form.control} name="youtubeUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.videoUrl')}</FormLabel>
                        <FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2">
                      <FormLabel>{tr(locale, 'form.labels.videoUrls')}</FormLabel>
                      <VideoUrlsEditor form={form} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="priceMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, "form.labels.priceMode")}</FormLabel>
                        <FormControl>
                          <select className="w-full rounded border bg-background p-2" value={field.value} onChange={field.onChange}>
                            <option value="firm">{locale === 'ar' ? 'ثابت' : 'Firm'}</option>
                            <option value="negotiable">{locale === 'ar' ? 'قابل للتفاوض' : 'Negotiable'}</option>
                            <option value="call">{locale === 'ar' ? 'اتصل بي' : 'Call me'}</option>
                            <option value="hidden">{locale === 'ar' ? 'إخفاء السعر' : 'Hide price'}</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{(String(form.watch('category') || '') === 'sales') ? (locale === 'ar' ? 'المبيعات' : 'Sales') : tr(locale, "form.subservices.titlePlural")}</div>
                    {subFieldArray.fields.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        {(String(form.watch('category') || '') === 'sales')
                          ? (locale === 'ar' ? 'لا توجد مبيعات' : 'No sales yet.')
                          : tr(locale, 'form.subservices.empty')}
                      </div>
                    )}
                    {subFieldArray.fields.map((f, index) => (
                      <div key={f.id} className="grid grid-cols-1 gap-3 rounded border p-3 sm:grid-cols-5">
                        <FormField control={form.control} name={`subservices.${index}.title` as const} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>{(String(form.watch('category') || '') === 'sales') ? (locale === 'ar' ? 'عنوان المنتج' : 'Product title') : tr(locale, 'form.subservices.title')}</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`subservices.${index}.price` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>{(String(form.watch('category') || '') === 'sales') ? (locale === 'ar' ? 'سعر البيع' : 'Sale price') : tr(locale, 'form.subservices.price')}</FormLabel>
                            <FormControl><Input type="number" min={0} step="1" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => subFieldArray.remove(index)}>
                            {(String(form.watch('category') || '') === 'sales') ? (locale === 'ar' ? 'إزالة بيع' : 'Remove sale') : tr(locale, 'form.subservices.remove')}
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      className="font-bold text-red-600 hover:text-red-700 text-base md:text-lg"
                      onClick={() => subFieldArray.append({ id: `${Date.now()}`, title: "", price: 0 })}
                    >
                      + {(String(form.watch('category') || '') === 'sales') ? (locale === 'ar' ? 'إضافة بيع' : 'Add sale') : tr(locale, 'form.subservices.add')}
                    </Button>
                  </div>
                  {(computedTotal > 0 && subFieldArray.fields.length > 0 && priceModeValue !== 'call' && priceModeValue !== 'hidden') && (
                    <>
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, "form.labels.price")}</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} step="1" value={Number(form.watch('price') || 0)} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="showPriceInContact"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} id="showPriceInContact" />
                              <FormLabel htmlFor="showPriceInContact" className="!mt-0">{tr(locale, 'form.labels.showPriceInContact')}</FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">{wiz.reviewHint}</div>
                  <div className="space-y-2 rounded border p-3 text-sm">
                    <div><span className="font-medium">{wiz.category}:</span> {(() => { const id = String(form.watch('category')||'') as keyof typeof CATEGORY_DEFS; return CATEGORY_DEFS[id]?.[locale] || String(id); })()}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.title")}:</span> {form.watch("title")}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.description")}:</span> {form.watch("description")}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.city")}:</span> {cityLabel(locale, String(form.watch("city") || ""))}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.area")}:</span> {String(form.watch("area") || "-")}</div>
                    <div><span className="font-medium">{tr(locale, 'details.location')}:</span> {form.watch('location.address') || `${latNum ?? '-'}, ${lngNum ?? '-'}`}</div>
                    <div className="space-y-2">
                      <FormLabel>{tr(locale, 'form.labels.images')}</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={getUploadMode(uid) === 'storage' && !uid}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (!files.length) return;
                          const mode = getUploadMode(uid);
                          try {
                            let mapped: { url: string; displayUrl?: string }[] = [];
                            const heic = files.filter((f) => isHeic(f));
                            const rest = files.filter((f) => !isHeic(f));
                            // HEIC/HEIF: preview as JPEG data URLs; upload only when using Cloudinary mode
                            if (heic.length > 0) {
                              const limitedHeic = heic.slice(0, 4);
                              const heicDataUrls = await Promise.all(limitedHeic.map((f) => compressToDataUrl(f, 800, 0.6)));
                              if (mode === 'cloudinary') {
                                const heicFiles = await Promise.all(heicDataUrls.map((u, i) => dataUrlToFile(u, `heic_${Date.now()}_${i}.jpg`)));
                                const heicUrls = await uploadToCloudinary(heicFiles);
                                mapped.push(...heicUrls.map((u, i) => ({ url: u, displayUrl: heicDataUrls[i] })));
                              } else {
                                mapped.push(...heicDataUrls.map((u) => ({ url: u, displayUrl: u })));
                              }
                            }
                            if (rest.length > 0) {
                              if (mode === 'inline') {
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 800, 0.6)));
                                mapped.push(...previews.map((u) => ({ url: u, displayUrl: u })));
                              } else if (mode === 'local') {
                                const fd = new FormData();
                                rest.forEach((f) => fd.append('files', f));
                                const res = await fetch('/api/uploads', { method: 'POST', body: fd });
                                if (!res.ok) throw new Error('local_upload_failed');
                                const data = await res.json();
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                const urls = (data.urls || []) as string[];
                                mapped.push(...urls.map((u, i) => ({ url: u, displayUrl: previews[i] || undefined })));
                              } else if (mode === 'cloudinary') {
                                const urls = await uploadToCloudinary(rest as File[]);
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                mapped.push(...urls.map((u, i) => ({ url: u, displayUrl: previews[i] || undefined })));
                              } else {
                                if (!uid) throw new Error('no_uid');
                                const uploaded = await uploadServiceImages(uid, rest as File[]);
                                const previews = await Promise.all(rest.map((f) => compressToDataUrl(f, 600, 0.6)));
                                mapped.push(...uploaded.map((u, i) => ({ url: u.url, displayUrl: previews[i] || undefined })));
                              }
                            }
                            const prev = imagesState || [];
                            const next = [...prev, ...mapped];
                            setImagesState(next);
                            await persistDraft();
                          } catch (err: any) {
                            const m = (err?.message || String(err || '')).slice(0, 300);
                            toast({ variant: 'destructive', title: tr(locale, 'form.toasts.addImagesFailed'), description: m });
                            // Optional fallback previews so user still sees something; submit-time safety will re-upload these.
                            try {
                              const limited = files.slice(0, 2);
                              const dataUrls = await Promise.all(limited.map((f) => compressToDataUrl(f, 800, 0.6)));
                              const mapped = dataUrls.map((u) => ({ url: u, displayUrl: u }));
                              const prev = imagesState || [];
                              const next = [...prev, ...mapped];
                              setImagesState(next);
                              await persistDraft();
                            } catch {}
                          }
                        }}
                      />
{Array.isArray(imagesState) && imagesState.length > 0 && (
                        <div className="mt-1 grid grid-cols-3 gap-2 md:grid-cols-4">
                          {imagesState.map((im: any, i: number) => (
                            <img
                              key={`${im.url}_${i}`}
                              src={(im as any).displayUrl || urlForPreview(im.url)}
                              alt=""
                              className="h-20 w-full rounded object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = (im as any).displayUrl || 'https://placehold.co/800x600.png'; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {!!form.watch('youtubeUrl') && (
                      <div><a className="text-primary underline" href={String(form.watch('youtubeUrl'))} target="_blank" rel="noreferrer">{String(form.watch('youtubeUrl'))}</a></div>
                    )}
                    {Array.isArray(form.watch('videoUrls')) && form.watch('videoUrls')!.length > 0 && (
                      <div className="space-y-1">
                        {form.watch('videoUrls')!.map((u, i) => (
                          <div key={`${u}_${i}`}>• <a className="text-primary underline" href={u} target="_blank" rel="noreferrer">{u}</a></div>
                        ))}
                      </div>
                    )}
                    <Separator />
                    <div>
                      <span className="font-medium">{tr(locale, "form.labels.price")}:</span>{' '}
                      {(() => {
                        const mode = String(form.watch('priceMode') || 'firm');
                        const price = Number(form.watch('price') || 0);
                        if (mode === 'call') return tr(locale, 'details.callForPrice');
                        const base = `${price} LYD`;
                        if (mode === 'negotiable') return `${base} (${tr(locale, 'details.negotiable')})`;
                        return base;
                      })()}
                    </div>
                    {Array.isArray(form.watch("subservices")) && form.watch("subservices")!.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">{tr(locale, "form.subservices.titlePlural")}:</div>
                        <ul className="list-inside list-disc">
                          {form.watch("subservices")!.map((s, i) => (
                            <li key={i}>{s.title} — {s.price} LYD</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={goPrev} disabled={step === 1}>{tr(locale, "common.previous")}</Button>
                {step < 6 ? (
                  <Button type="button" onClick={goNext} disabled={disableNext}>{tr(locale, "common.next")}</Button>
                ) : (
                  <Button type="button" onClick={handleFinish}>{wiz.finish}</Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline helper to edit multiple YouTube URLs
function VideoUrlsEditor({ form }: { form: any }) {
  const urls: string[] = form.watch('videoUrls') || [];
  const [newUrl, setNewUrl] = useState('');
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {urls.map((url, idx) => (
          <div key={`${url}_${idx}`} className="flex flex-wrap items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              value={url}
              onChange={(e) => {
                const next = [...(form.getValues('videoUrls') || [])];
                next[idx] = e.target.value;
                form.setValue('videoUrls', next, { shouldValidate: true });
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Button type="button" variant="outline" onClick={() => {
              const next = (form.getValues('videoUrls') || []).filter((_: any, i: number) => i !== idx);
              form.setValue('videoUrls', next, { shouldValidate: true });
            }}>Remove</Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-0 flex-1" placeholder="https://www.youtube.com/watch?v=..." value={newUrl} onChange={(e)=>setNewUrl(e.target.value)} />
        <Button type="button" variant="secondary" onClick={() => {
          const v = newUrl.trim();
          if (!v) return;
          const next = [...(form.getValues('videoUrls') || []), v];
          form.setValue('videoUrls', next, { shouldValidate: true });
          setNewUrl('');
        }}>+ Add</Button>
      </div>
    </div>
  );
}
