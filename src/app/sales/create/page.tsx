"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import L from "leaflet";

import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { saleItemSchema, type SaleItemForm } from "@/lib/schemas-sale";
import { getClientLocale, tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { libyanCities, cityLabel, cityCenter } from "@/lib/cities";
import CityPicker from "@/components/city-picker";
import { tileUrl, tileAttribution, markerHtml } from "@/lib/map";
import { createSaleItem, uploadSaleImages } from "@/lib/sale-items";
import { getUploadMode } from "@/lib/images";

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

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
  await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; img.src = raw; });
  const scale = Math.min(1, maxWidth / (img.width || maxWidth));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((img.width || maxWidth) * scale);
  canvas.height = Math.round((img.height || maxWidth) * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function CreateSaleItemPage() {
  const { user, userProfile, loading } = useAuth();
  const locale = getClientLocale();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'provider')) {
      try { window.location.href = '/login'; } catch {}
    }
  }, [loading, user, userProfile?.role]);
  if (loading || !user || userProfile?.role !== 'provider') return null;

  const form = useForm<SaleItemForm>({
    resolver: zodResolver(saleItemSchema),
    mode: 'onChange',
    defaultValues: {
      category: 'sales',
      title: '',
      price: 0,
      priceMode: 'firm',
      trade: { enabled: false },
      images: [],
      videoUrls: [],
      status: 'pending',
      city: libyanCities[0]?.value ?? 'Tripoli',
      location: { lat: 32.8872, lng: 13.1913 },
      contactPhone: '',
      contactWhatsapp: '',
    },
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    // Sync previews into form images so step 4 validation passes
    try {
      const imgs = urls.map((u) => ({ url: u }));
      form.setValue('images', imgs as any, { shouldValidate: true });
    } catch {}
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [selectedFiles]);

  const wiz = useMemo(() => ({
    title: locale === 'ar' ? 'إنشاء عنصر للبيع' : 'Create Sale Item',
    subtitle: locale === 'ar' ? '5 خطوات بسيطة' : '5 simple steps',
    category: locale === 'ar' ? 'الفئة' : 'Category',
    details: locale === 'ar' ? 'التفاصيل' : 'Details',
    location: locale === 'ar' ? 'الموقع' : 'Location',
    media: locale === 'ar' ? 'الصور والفيديو' : 'Media',
    confirm: locale === 'ar' ? 'تأكيد' : 'Confirm',
  }), [locale]);

  const markerIcon = useMemo(() => L.divIcon({ className: '', html: markerHtml, iconSize: [20,20], iconAnchor: [10,10] }), []);
  const latNum = Number(form.watch('location.lat') || 32.8872);
  const lngNum = Number(form.watch('location.lng') || 13.1913);

  async function goNext() {
    const fieldsByStep: Record<typeof step, any[]> = {
      1: ['category'],
      2: ['title','price','priceMode'],
      3: ['city','location'],
      4: ['images'],
      5: [],
    };
    const fields = fieldsByStep[step];
    if (fields.length) {
      const ok = await form.trigger(fields as any, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => (s >= 5 ? 5 : ((s + 1) as any)));
  }

  function goPrev() {
    // In the Sales wizard, Step 1 (Category) is redundant; clamp to step >= 2
    setStep((s) => (s <= 2 ? 2 : ((s - 1) as any)));
  }

  async function handleFinish() {
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) {
      toast({
        variant: 'destructive',
        title:
          locale === 'ar'
            ? 'O�O_OrU, OU,O�O�U,U% OU,U^O�U? U.U+ OU,O�O3OO�U,'
            : 'Please fix the highlighted fields before publishing',
      });
      return;
    }
    const u = user;
    if (!u) return;
    try {
      let images = form.getValues('images');
      const mode = getUploadMode(u.uid);
      if (selectedFiles.length > 0) {
        const limited = selectedFiles.slice(0, 8);
        try {
          if (mode === 'storage') {
            // Normal path: upload to Firebase Storage
            images = await uploadSaleImages(u.uid, limited);
          } else {
            // inline/local/cloudinary: keep compressed data URLs in Firestore
            if (mode === 'cloudinary') {
              console.warn(
                '[SalesCreate] Cloudinary mode not fully supported for sales; keeping inline data URLs instead of uploading.'
              );
            }
            const dataUrls = await Promise.all(
              limited.map((f) => compressToDataUrl(f, 1000, 0.7))
            );
            images = dataUrls.map((v) => ({ url: v }));
          }
        } catch {
          // Fallback: always succeed with inline data URLs
          const dataUrls = await Promise.all(
            limited.map((f) => compressToDataUrl(f, 1000, 0.7))
          );
          images = dataUrls.map((v) => ({ url: v }));
        }
        form.setValue('images', images as any, { shouldValidate: true });
      }
      const providerName = userProfile?.displayName || u.displayName || (u.email ? u.email.split('@')[0] : null);
      const providerEmail = u.email || null;
      const id = await createSaleItem({ ...(form.getValues()), images, providerId: u.uid, providerName, providerEmail });
      toast({ title: locale === 'ar' ? 'تم إنشاء عنصر للبيع' : 'Sale item created' });
     // try { window.location.href = `/sales`; } catch {}
     try { window.location.href = `/sales/${id}`; } catch {}

    } catch (e: any) {
      toast({ variant: 'destructive', title: e?.message || 'Failed' });
    }
  }

  return (
    <div className="mx-auto max-w-3xl pt-16 md:pt-20">
      <Card>
        <CardHeader>
          <CardTitle>{wiz.title}</CardTitle>
          <CardDescription>{wiz.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mb-2 flex items-center gap-2 text-sm">
            {[1,2,3,4,5].map((n) => (
              <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold" : "text-muted-foreground"}`}>
                <div className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{n}</div>
                <span>{n===1?wiz.category:n===2?wiz.details:n===3?wiz.location:n===4?wiz.media:wiz.confirm}</span>
                {n<5 && <span className="mx-2 text-muted-foreground">›</span>}
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{wiz.category}</FormLabel>
                      <Input value={field.value} readOnly />
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr(locale,'form.labels.title')}</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale,'form.labels.price')}</FormLabel>
                        <Input type="number" min={0} step="1" value={Number(field.value as any)} onChange={(e)=>field.onChange(Number(e.target.value))} />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="priceMode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale,'form.labels.priceMode')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder={tr(locale,'form.labels.priceMode')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="firm">{locale==='ar'?'ثابت':'Firm'}</SelectItem>
                            <SelectItem value="negotiable">{locale==='ar'?'قابل للتفاوض':'Negotiable'}</SelectItem>
                            <SelectItem value="call">{locale==='ar'?'اتصل بي':'Call'}</SelectItem>
                            <SelectItem value="hidden">{locale==='ar'?'إخفاء السعر':'Hide price'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="condition" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{locale==='ar'?'الحالة':'Condition'}</FormLabel>
                        <Select value={field.value as any} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder={locale==='ar'?'اختر الحالة':'Select condition'} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">{locale==='ar'?'جديد':'New'}</SelectItem>
                            <SelectItem value="like-new">{locale==='ar'?'شبه جديد':'Like new'}</SelectItem>
                            <SelectItem value="used">{locale==='ar'?'مستعمل':'Used'}</SelectItem>
                            <SelectItem value="for-parts">{locale==='ar'?'قطع':'For parts'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="trade.enabled" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={!!field.value} onCheckedChange={(v)=>field.onChange(!!v)} id="trade_en" />
                        <FormLabel htmlFor="trade_en" className="!mt-0">{locale==='ar'?'أقبل المبادلة':'Open to trade'}</FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {form.watch('trade.enabled') && (
                    <FormField control={form.control} name="trade.tradeFor" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{locale==='ar'?'على ماذا تبادل؟':'Trade for what?'}</FormLabel>
                        <Input placeholder={locale==='ar'?'هاتف، لابتوب، خدمات':'Phone, laptop, services'} {...field} />
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr(locale,'form.labels.description')}</FormLabel>
                      <Textarea rows={3} {...field} />
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

             {step === 3 && (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr(locale, "form.labels.city")}</FormLabel>
            <CityPicker
              locale={locale as any}
              value={field.value}
              options={libyanCities}
              onChange={(v) => {
                // update city field
                field.onChange(v);

                // move marker to selected city center
                const center = cityCenter(v);
                if (center) {
                  const lat = Number(center.lat.toFixed(6));
                  const lng = Number(center.lng.toFixed(6));
                  form.setValue("location.lat", lat, { shouldValidate: true });
                  form.setValue("location.lng", lng, { shouldValidate: true });
                }
              }}
            />
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
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="rounded border">
      <MapContainer
        // 👇 this key forces the map to re-mount when city changes
        key={form.watch("city") || "default-city"}
        center={[latNum, lngNum]}
        zoom={13}
        scrollWheelZoom={false}
        className="cursor-crosshair"
        style={{ height: 280, width: "100%" }}
        onClick={(e: any) => {
          const { lat, lng } = e?.latlng || {};
          if (typeof lat === "number" && typeof lng === "number") {
            form.setValue("location.lat", Number(lat.toFixed(6)), {
              shouldValidate: true,
            });
            form.setValue("location.lng", Number(lng.toFixed(6)), {
              shouldValidate: true,
            });
          }
        }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <ScaleControl imperial={false} position="bottomleft" />
        <Marker
          position={[latNum, lngNum]}
          icon={markerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e: any) => {
              const m = e?.target;
              if (m?.getLatLng) {
                const p = m.getLatLng();
                form.setValue("location.lat", Number(p.lat.toFixed(6)), {
                  shouldValidate: true,
                });
                form.setValue("location.lng", Number(p.lng.toFixed(6)), {
                  shouldValidate: true,
                });
              }
            },
          }}
        >
          <Popup>
            {locale === "ar" ? "الموقع المحدد" : "Selected location"}
          </Popup>
        </Marker>
      </MapContainer>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="contactPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr(locale, "form.labels.contactPhone")}</FormLabel>
            <Input
              placeholder={
                tr(locale, "form.placeholders.contactPhone") as string
              }
              {...field}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contactWhatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr(locale, "form.labels.contactWhatsapp")}</FormLabel>
            <Input
              placeholder={
                tr(locale, "form.placeholders.contactWhatsapp") as string
              }
              {...field}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={form.control}
      name="hideExactLocation"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(!!v)}
              id="hide_exact"
            />
            <FormLabel htmlFor="hide_exact" className="!mt-0">
              {locale === "ar"
                ? "إخفاء الموقع على الخريطة"
                : "Hide exact location on map"}
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)}


              {step === 4 && (
                <div className="space-y-4">
                  <FormLabel>{locale==='ar'?'صور الإعلان':'Images'}</FormLabel>
                  <Input type="file" accept="image/*" multiple onChange={(e)=> setSelectedFiles(Array.from(e.target.files || []).slice(0, 8))} />
                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                      {previews.map((src, i) => (
                        <div key={i} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-24 w-full rounded object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>{locale==='ar'?'راجع التفاصيل ثم انشر':'Review details then publish'}</div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={goPrev} disabled={step<=2}>{locale==='ar'?'رجوع':'Back'}</Button>
                {step < 5 ? (
                  <Button type="button" onClick={goNext}>{locale==='ar'?'التالي':'Next'}</Button>
                ) : (
                  <Button type="button" onClick={handleFinish}>{locale==='ar'?'نشر':'Publish'}</Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
