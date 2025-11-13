"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { getSaleItemById, updateSaleItem, type SaleItem } from "@/lib/sale-items";

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

export default function EditSaleItemPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { user, userProfile, loading } = useAuth();
  const locale = getClientLocale();
  const { toast } = useToast();

  const [loadingItem, setLoadingItem] = useState(true);
  const [item, setItem] = useState<SaleItem | null>(null);

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
    },
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingItem(true);
      try {
        const it = await getSaleItemById(id);
        setItem(it);
        if (it) {
          form.reset({
            category: 'sales',
            title: String(it.title || ''),
            price: Number((it as any)?.price ?? 0),
            priceMode: String((it as any)?.priceMode || 'firm') as any,
            condition: (it as any)?.condition,
            trade: { enabled: !!(it as any)?.trade?.enabled, tradeFor: (it as any)?.trade?.tradeFor },
            images: Array.isArray((it as any)?.images) ? (it as any)?.images : [],
            videoUrls: Array.isArray((it as any)?.videoUrls) ? (it as any)?.videoUrls : [],
            status: String((it as any)?.status || 'pending') as any,
            city: String((it as any)?.city || (libyanCities[0]?.value ?? 'Tripoli')),
            area: (it as any)?.area,
            location: {
              lat: Number((it as any)?.location?.lat ?? 32.8872),
              lng: Number((it as any)?.location?.lng ?? 13.1913),
              address: (it as any)?.location?.address,
            },
            hideExactLocation: !!(it as any)?.hideExactLocation,
          } as any);
          const existing = (Array.isArray((it as any)?.images) ? (it as any)?.images : []).map((im: any) => String(im?.url || ''));
          setPreviews(existing.filter(Boolean));
        }
      } finally {
        setLoadingItem(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (selectedFiles.length === 0) return;
    (async () => {
      const dataUrls = await Promise.all(selectedFiles.slice(0, 8).map((f) => compressToDataUrl(f, 1000, 0.7)));
      const merged = [...(form.getValues('images') as any[]).filter((x: any) => !!x?.url), ...dataUrls.map((u) => ({ url: u }))];
      form.setValue('images', merged as any, { shouldValidate: true });
      setPreviews(merged.map((im: any) => String(im?.url || '')).filter(Boolean));
    })();
  }, [selectedFiles]);

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'provider')) {
      try { window.location.href = '/login'; } catch {}
    }
  }, [loading, user, userProfile?.role]);
  if (!id || loading || !user || userProfile?.role !== 'provider') return null;

  const wiz = useMemo(() => ({
    title: locale === 'ar' ? 'تعديل إعلان' : 'Edit Sale Item',
    subtitle: locale === 'ar' ? '4 خطوات' : '4 steps',
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
      1: [],
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
    setStep((s) => (s <= 2 ? 2 : ((s - 1) as any)));
  }

  async function handleSave() {
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) return;
    try {
      const values = form.getValues();
      await updateSaleItem(id, values);
      toast({ title: locale === 'ar' ? 'تم الحفظ' : 'Saved' });
      try { window.location.href = '/dashboard/services'; } catch {}
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
            {[2,3,4,5].map((n) => (
              <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold" : "text-muted-foreground"}`}>
                <div className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{n}</div>
                <span>{n===2?wiz.details:n===3?wiz.location:n===4?wiz.media:wiz.confirm}</span>
                {n<5 && <span className="mx-2 text-muted-foreground">›</span>}
              </div>
            ))}
          </div>

          {loadingItem ? (
            <p className="text-muted-foreground">{tr(locale,'home.loading')}</p>
          ) : !item ? (
            <p className="text-muted-foreground">{locale==='ar'?'غير موجود':'Not found'}</p>
          ) : (
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale,'form.labels.city')}</FormLabel>
                          <CityPicker locale={locale as any} value={field.value} options={libyanCities} onChange={(v)=>{ field.onChange(v); const c = cityCenter(v); if (c) { form.setValue('location.lat', c.lat, { shouldValidate: true }); form.setValue('location.lng', c.lng, { shouldValidate: true }); } }} />
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="area" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale,'form.labels.area')}</FormLabel>
                          <Input {...field} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="rounded border">
                      <MapContainer center={[latNum, lngNum]} zoom={13} scrollWheelZoom={false} className="cursor-crosshair" style={{ height: 280, width: '100%'}}
                        onClick={(e: any) => { const { lat, lng } = e?.latlng || {}; if (typeof lat === 'number' && typeof lng === 'number') { form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true }); form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true }); } }}
                      >
                        <TileLayer url={tileUrl} attribution={tileAttribution} />
                        <ScaleControl imperial={false} position="bottomleft" />
                        <Marker position={[latNum, lngNum]} icon={markerIcon}>
                          <Popup>{locale==='ar'?'الموقع المحدد':'Selected location'}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    <FormField control={form.control} name="hideExactLocation" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!field.value} onCheckedChange={(v)=>field.onChange(!!v)} id="hide_exact" />
                          <FormLabel htmlFor="hide_exact" className="!mt-0">{locale==='ar'?'إخفاء الموقع على الخريطة':'Hide exact location on map'}</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

              {step === 4 && (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="images"
      render={() => {
        const images = (form.watch("images") || []) as { url: string }[];

        async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;

          // compress + convert to data URL (same as create page)
          const limited = files.slice(0, 8);
          const dataUrls = await Promise.all(
            limited.map((f) => compressToDataUrl(f, 1000, 0.7))
          );

          const newImages = [
            ...images,
            ...dataUrls.map((u) => ({ url: u })),
          ];

          form.setValue("images", newImages as any, { shouldValidate: true });
        }

        function handleRemoveImage(index: number) {
          const next = images.filter((_, i) => i !== index);
          form.setValue("images", next as any, { shouldValidate: true });
        }

        return (
          <FormItem>
            <FormLabel>
              {locale === "ar" ? "صور الإعلان" : "Ad images"}
            </FormLabel>

            {/* file input */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="block w-full text-sm text-muted-foreground file:me-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />

            {/* thumbnails + remove button */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded border bg-muted"
                  >
                    <img
                      src={img.url}
                      alt={`image-${idx}`}
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
                    >
                      {locale === "ar" ? "حذف" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  </div>
)}


                {step === 5 && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>{locale==='ar'?'راجع التفاصيل ثم احفظ':'Review details then save'}</div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={goPrev} disabled={step<=2}>{locale==='ar'?'رجوع':'Back'}</Button>
                  {step < 5 ? (
                    <Button type="button" onClick={goNext}>{locale==='ar'?'التالي':'Next'}</Button>
                  ) : (
                    <Button type="button" onClick={handleSave}>{locale==='ar'?'حفظ':'Save'}</Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
