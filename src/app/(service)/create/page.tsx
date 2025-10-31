"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import L from "leaflet";
import { useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { serviceSchema, type ServiceFormData } from "@/lib/schemas";
import { getClientLocale, tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { libyanCities, cityLabel } from "@/lib/cities";
import { createService, uploadServiceImages } from "@/lib/services";
import { getServiceDraft, saveServiceDraft, deleteServiceDraft } from "@/lib/service-drafts";
import { tileUrl, tileAttribution, markerHtml } from "@/lib/map";
import AddressSearch from "@/components/address-search";
import { reverseGeocodeNominatim, getLangFromDocument } from "@/lib/geocode";
import { CategoryCards, CATEGORY_DEFS } from "@/components/category-cards";

// Client-only react-leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

// Step schemas
const catSchema = z.object({ category: serviceSchema.shape.category });
const detailsStepSchema = z.object({
  title: serviceSchema.shape.title,
  description: serviceSchema.shape.description,
  city: serviceSchema.shape.city,
  area: serviceSchema.shape.area,
  location: serviceSchema.shape.location,
  availabilityNote: serviceSchema.shape.availabilityNote,
  contactPhone: serviceSchema.shape.contactPhone,
  contactWhatsapp: serviceSchema.shape.contactWhatsapp,
  mapUrl: serviceSchema.shape.mapUrl,
  facebookUrl: serviceSchema.shape.facebookUrl,
  telegramUrl: serviceSchema.shape.telegramUrl,
});
const mediaSchema = z.object({
  images: serviceSchema.shape.images,
  videoUrl: serviceSchema.shape.videoUrl.optional(),
  videoUrls: serviceSchema.shape.videoUrls.optional(),
});
const pricingSchema = z.object({ price: serviceSchema.shape.price, subservices: serviceSchema.shape.subservices });

type Step = 1 | 2 | 3 | 4 | 5;

export default function CreateServiceWizardPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const locale = getClientLocale();
  const router = useRouter();

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

  const wiz = useMemo(() => {
    return {
      title: tr(locale, 'wizard.title'),
      subtitle: tr(locale, 'wizard.subtitle5'),
      category: tr(locale, 'wizard.steps.category'),
      details: tr(locale, 'wizard.steps.details'),
      media: tr(locale, 'wizard.steps.media'),
      pricing: tr(locale, 'wizard.steps.pricing'),
      confirm: tr(locale, 'wizard.steps.confirm'),
      reviewHint: tr(locale, 'wizard.reviewHint'),
      finish: tr(locale, 'wizard.finish'),
    };
  }, [locale]);

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

  function MapClickWatcher() {
    useMapEvents({
      click(e: any) {
        const { lat, lng } = e?.latlng || {};
        if (typeof lat === 'number' && typeof lng === 'number') {
          form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true });
          form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true });
        }
      }
    });
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
        try {
          form.setValue('location.address', r.displayName, { shouldValidate: false, shouldDirty: true });
          const areaName = extractAreaFromDisplayName(r.displayName);
          if (areaName) form.setValue('area', areaName, { shouldValidate: false });
        } catch {}
      })
      .catch((e) => {
        if ((e as any)?.name === 'AbortError') return;
        setSelectedAddress('');
      });
    return () => ac.abort();
  }, [latNum, lngNum, form]);

  // Save draft helper
  const persistDraft = async () => {
    if (!uid) return;
    const values = form.getValues();
    await saveServiceDraft(uid, values);
  };

  const goNext = async () => {
    const fieldsByStep: Record<Step, (keyof ServiceFormData)[]> = {
      1: ["category"],
      2: [
        "title",
        "description",
        "city",
        "area",
        "location" as any,
        "availabilityNote",
        "contactPhone",
        "contactWhatsapp",
        "mapUrl" as any,
        "facebookUrl" as any,
        "telegramUrl" as any,
      ],
      3: ["images" as any, "videoUrl" as any, "videoUrls" as any],
      4: ["price", "subservices"],
      5: [],
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
    await persistDraft();
    setStep((s): Step => (s >= 5 ? 5 : ((s + 1) as Step)));
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
    if (step === 3) return !mediaSchema.safeParse(form.watch()).success;
    if (step === 4) return !pricingSchema.safeParse(form.watch()).success;
    return false;
  }, [step, form.watch()]);

  const handleFinish = async () => {
    if (!uid) return;
    const valid = await form.trigger(undefined, { shouldFocus: true });
    if (!valid) return;
    const values = form.getValues();
    const payload = {
      ...values,
      providerId: uid,
      providerName: user?.displayName ?? null,
      providerEmail: user?.email ?? null,
      images: (values.images || []).map((it) => ({ url: it.url })),
      lat: values.location?.lat,
      lng: values.location?.lng,
      videoUrl: values.youtubeUrl || values.videoUrl,
      videoUrls: Array.isArray(values.videoUrls) ? values.videoUrls.filter(Boolean) : undefined,
      status: "pending" as const,
    } as any;
    try {
      const id = await createService(payload);
      await deleteServiceDraft(uid);
      router.push("/dashboard/services");
    } catch (e) {
      console.error(e);
    }
  };

  const Stepper = () => (
    <div className="mb-4 flex items-center gap-2 text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold" : "text-muted-foreground"}`}>
          <div className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {n}
          </div>
          <span>
            {n === 1 ? wiz.category : n === 2 ? wiz.details : n === 3 ? wiz.media : n === 4 ? wiz.pricing : wiz.confirm}
          </span>
          {n < 5 && <span className="mx-2 text-muted-foreground">›</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
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
                <div className="space-y-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, "form.labels.city")}</FormLabel>
                          <FormControl>
                            <select className="w-full rounded border bg-background p-2" value={field.value} onChange={field.onChange}>
                              {libyanCities.map((c) => (
                                <option key={c.value} value={c.value}>{cityLabel(locale, c.value)}</option>
                              ))}
                            </select>
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
                    <AddressSearch
                      value={(form.watch('location.address') as string) || selectedAddress}
                      placeholder={tr(locale, 'form.placeholders.searchAddress') as string}
                      countryCodes="ly"
                      city={String(form.watch('city') || '')}
                      onSelect={({ lat, lng, displayName }: any) => {
                        form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true });
                        form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true });
                        if (displayName) {
                          form.setValue('location.address', displayName, { shouldValidate: false });
                          const areaName = extractAreaFromDisplayName(displayName);
                          if (areaName) form.setValue('area', areaName, { shouldValidate: false });
                        }
                      }}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField control={form.control} name="location.lat" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, 'form.labels.latitude')}</FormLabel>
                          <FormControl><Input type="number" step="0.000001" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="location.lng" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr(locale, 'form.labels.longitude')}</FormLabel>
                          <FormControl><Input type="number" step="0.000001" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="rounded border">
                      <MapContainer center={[latNum ?? 32.8872, lngNum ?? 13.1913]} zoom={13} scrollWheelZoom={false} className="cursor-crosshair" style={{ height: 280, width: '100%'}}
                        onClick={(e: any) => {
                          const { lat, lng } = e?.latlng || {};
                          if (typeof lat === 'number' && typeof lng === 'number') {
                            form.setValue('location.lat', Number(lat.toFixed(6)), { shouldValidate: true });
                            form.setValue('location.lng', Number(lng.toFixed(6)), { shouldValidate: true });
                          }
                        }}
                      >
                        <TileLayer url={tileUrl} attribution={tileAttribution} />
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
                                }
                              }
                            }}
                          >
                            <Popup>{selectedAddress || tr(locale, 'form.map.selected')}</Popup>
                          </Marker>
                        )}
                        <ScaleControl imperial={false} position="bottomleft" />
                      </MapContainer>
                    </div>
                    {selectedAddress && (
                      <div className="text-sm text-muted-foreground">{selectedAddress}</div>
                    )}
                  </div>

                  {/* Contact & social */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.contactPhone')}</FormLabel>
                        <FormControl><Input type="tel" placeholder={tr(locale, 'form.placeholders.contactPhone') as string} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contactWhatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.contactWhatsapp')}</FormLabel>
                        <FormControl><Input type="tel" placeholder={tr(locale, 'form.placeholders.contactWhatsapp') as string} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="availabilityNote" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.availabilityNote')}</FormLabel>
                        <FormControl><Textarea rows={2} placeholder={tr(locale, 'form.placeholders.availability') as string} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="mapUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.mapUrl')}</FormLabel>
                        <FormControl><Input type="url" placeholder="https://maps.google.com/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
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
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>{tr(locale, 'form.labels.images')}</FormLabel>
                    <Input type="file" accept="image/*" multiple onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length || !uid) return;
                      try {
                        const uploaded = await uploadServiceImages(uid, files as File[]);
                        const mapped = uploaded.map((u) => ({ url: u.url }));
                        const prev = form.getValues('images') || [];
                        form.setValue('images', [...prev, ...mapped], { shouldValidate: true });
                        await persistDraft();
                      } catch (err) {
                        console.error('Image upload failed', err);
                      }
                    }} />
                    {Array.isArray(form.watch('images')) && form.watch('images')!.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-4">
                        {form.watch('images')!.map((img, i) => (
                          <div key={`${img.url}_${i}`} className="relative">
                            <img src={img.url} alt="" className="h-24 w-full rounded object-cover" />
                            <button type="button" className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white" onClick={() => {
                              const next = (form.getValues('images') || []).filter((_, idx) => idx !== i);
                              form.setValue('images', next, { shouldValidate: true });
                            }}>×</button>
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
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, "form.labels.price")}</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{tr(locale, "form.subservices.titlePlural")}</div>
                    {subFieldArray.fields.length === 0 && (
                      <div className="text-sm text-muted-foreground">{tr(locale, "form.subservices.empty")}</div>
                    )}
                    {subFieldArray.fields.map((f, index) => (
                      <div key={f.id} className="grid grid-cols-1 gap-3 rounded border p-3 sm:grid-cols-5">
                        <FormField control={form.control} name={`subservices.${index}.title` as const} render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>{tr(locale, 'form.subservices.title')}</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`subservices.${index}.price` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>{tr(locale, 'form.subservices.price')}</FormLabel>
                            <FormControl><Input type="number" min={0} step="1" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => subFieldArray.remove(index)}>{tr(locale, 'form.subservices.remove')}</Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => subFieldArray.append({ id: `${Date.now()}`, title: "", price: 0 })}>+ {tr(locale, 'form.subservices.add')}</Button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">{wiz.reviewHint}</div>
                  <div className="space-y-2 rounded border p-3 text-sm">
                    <div><span className="font-medium">{wiz.category}:</span> {(() => { const id = String(form.watch('category')||'') as keyof typeof CATEGORY_DEFS; return CATEGORY_DEFS[id]?.[locale] || String(id); })()}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.title")}:</span> {form.watch("title")}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.description")}:</span> {form.watch("description")}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.city")}:</span> {cityLabel(locale, String(form.watch("city") || ""))}</div>
                    <div><span className="font-medium">{tr(locale, "form.labels.area")}:</span> {String(form.watch("area") || "-")}</div>
                    <div><span className="font-medium">{tr(locale, 'details.location')}:</span> {form.watch('location.address') || `${latNum ?? '-'}, ${lngNum ?? '-'}`}</div>
                    {Array.isArray(form.watch('images')) && form.watch('images')!.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">{tr(locale, 'form.labels.images')}</div>
                        <div className="mt-1 grid grid-cols-3 gap-2 md:grid-cols-4">
                          {form.watch('images')!.map((im, i) => (
                            <img key={`${im.url}_${i}`} src={im.url} alt="" className="h-20 w-full rounded object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
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
                    <div><span className="font-medium">{tr(locale, "form.labels.price")}:</span> {Number(form.watch("price") || 0)} LYD</div>
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
                {step < 5 ? (
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
