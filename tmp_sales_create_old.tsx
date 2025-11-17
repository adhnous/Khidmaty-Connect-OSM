"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import L from "leaflet";
import { useMapEvents } from "react-leaflet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { saleItemSchema, type SaleItemForm } from "@/lib/schemas-sale";
import { getClientLocale, tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { libyanCities, cityCenter } from "@/lib/cities";
import CityPicker from "@/components/city-picker";
import { tileUrl, tileAttribution, markerHtml } from "@/lib/map";
import { createSaleItem, uploadSaleImages } from "@/lib/sale-items";
import { getUploadMode } from "@/lib/images";
import { getSaleDraft, saveSaleDraft } from "@/lib/sale-drafts";
import {
  reverseGeocodeNominatim,
  getLangFromDocument,
} from "@/lib/geocode";

// ------------------ Title Categories ------------------
type TitleCategory = {
  id: string;
  ar: string;
  en: string;
  icon: string;
};

const TITLE_CATEGORIES: TitleCategory[] = [
  { id: "shops", ar: "+à+¬+º+¼+¦", en: "Shops", icon: "=ƒÅ¼" },
  { id: "cars", ar: "+¦+è+º+¦+º+¬ +ê+à+¦+â+¿+º+¬", en: "Cars & Vehicles", icon: "=ƒÜù" },
  { id: "motorcycles", ar: "+»+¦+º+¼+º+¬ +å+º+¦+è+¬", en: "Motorcycles", icon: "=ƒÅìn+Å" },
  { id: "property-sale", ar: "+¦+é+º+¦+º+¬ +ä+ä+¿+è+¦", en: "Property for sale", icon: "=ƒÅá" },
  { id: "property-rent", ar: "+¦+é+º+¦+º+¬ +ä+ä+º+è+¼+º+¦", en: "Property for rent", icon: "=ƒÅó" },
  { id: "jobs", ar: "+ê+++º+ª+ü", en: "Jobs", icon: "=ƒÆ+" },
  { id: "teaching", ar: "+¬+»+¦+è+¦ +ê+¬+»+¦+è+¿", en: "Teaching & training", icon: "=ƒÄô" },
  { id: "services", ar: "+º+ä+«+»+à+º+¬", en: "Services", icon: "=ƒ¢án+Å" },
  { id: "companies", ar: "+¦+¦+â+º+¬ +ê+à+¦+»+º+¬", en: "Companies & equipment", icon: "=ƒÅùn+Å" },
  { id: "electronics", ar: "+º+ä+â+¬+¦+ê+å+è+º+¬", en: "Electronics", icon: "=ƒô¦" },
  { id: "laptops", ar: "+ä+º+¿+¬+ê+¿ +ê+â+à+¿+è+ê+¬+¦", en: "Laptops & computers", icon: "=ƒÆ+" },
  { id: "mobiles", ar: "+à+ê+¿+º+è+ä - +¬+º+¿+ä+¬", en: "Mobile & tablet", icon: "=ƒô¦" },
  { id: "video-games", ar: "+ú+ä+¦+º+¿ +º+ä+ü+è+»+è+ê +ê+º+ä+ú+++ü+º+ä", en: "Video games & kids", icon: "=ƒÄ«" },
  { id: "home-garden", ar: "+º+ä+à+å+¦+ä +ê+º+ä+¡+»+è+é+¬", en: "Home & garden", icon: "=ƒ¢ïn+Å" },
  { id: "sports", ar: "+à+¦+»+º+¬ +¦+è+º+¦+è+¬ +ê +ä+è+º+é+¬", en: "Sports & fitness", icon: "=ƒÅâGÇìGÖén+Å" },
  { id: "kids-toys", ar: "+ä+ê+º+¦+à +º+ä+ú+++ü+º+ä +ê +º+ä+ú+ä+¦+º+¿", en: "Kids & toys", icon: "=ƒº+" },
  { id: "fashion-men", ar: "+ú+¦+è+º+í - +à+ê+¦+¬ +¦+¼+º+ä+è", en: "Men's fashion", icon: "=ƒæö" },
  { id: "fashion-women", ar: "+ú+¦+è+º+í - +à+ê+¦+¬ +å+¦+º+ª+è+¬", en: "Women's fashion", icon: "=ƒæù" },
  { id: "pets", ar: "+¡+è+ê+º+å+º+¬ +ê+º+â+¦+¦+ê+º+¦+º+¬", en: "Pets & accessories", icon: "=ƒÉ+" },
  { id: "food", ar: "+++¦+º+à - +¦+¦+º+í", en: "Food", icon: "=ƒìö" },
  { id: "books-entertainment", ar: "+¬+¦+ü+è+ç +ê+â+¬+¿ +ê+à+é+¬+å+è+º+¬", en: "Books & entertainment", icon: "=ƒôÜ" },
];

// ------------------ Dynamic Leaflet ------------------
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const ScaleControl = dynamic(() => import("react-leaflet").then(m => m.ScaleControl), { ssr: false });

function MapTapWatcher({ onTap }: { onTap: (e: any) => void }) {
  useMapEvents({
    click(e) {
      onTap(e);
    },
  });
  return null;
}

// ------------------ Helpers ------------------
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
  const img = document.createElement("img");
  await new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = rej;
    img.src = raw;
  });

  const scale = Math.min(1, maxWidth / (img.width || maxWidth));
  const canvas = document.createElement("canvas");
  canvas.width = (img.width || maxWidth) * scale;
  canvas.height = (img.height || maxWidth) * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function CreateSaleItemPage() {
  const { user, userProfile, loading } = useAuth();
  const locale = getClientLocale();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== "provider")) {
      window.location.href = "/login";
    }
  }, [loading, user, userProfile?.role]);

  if (loading || !user || userProfile?.role !== "provider") return null;

  // ------------------ Form setup ------------------
  const form = useForm<SaleItemForm>({
    resolver: zodResolver(saleItemSchema),
    mode: "onChange",
    defaultValues: {
      category: "sales",
      title: "",
      price: 0,
      priceMode: "firm",
      trade: { enabled: false },
      images: [],
      videoUrls: [],
      status: "pending",
      city: libyanCities[0]?.value ?? "Tripoli",
      location: { lat: 32.8872, lng: 13.1913 },
      contactPhone: "",
      contactWhatsapp: "",
    },
  });

  // ------------------ State ------------------
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showTitleCategories, setShowTitleCategories] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // ------------------ Extract Area Helper ------------------
  function extractAreaFromDisplayName(name: string): string {
    try {
      return String(name || "")
        .split(/OO|,/)
        .map(p => p.trim())
        .filter(Boolean)[0] || "";
    } catch {
      return "";
    }
  }

  // ------------------ Load Draft ------------------
  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const draft = await getSaleDraft(user.uid);
        if (draft) {
          form.reset({
            category: "sales",
            title: draft.title ?? "",
            price: draft.price ?? 0,
            priceMode: draft.priceMode ?? "firm",
            trade: draft.trade ?? { enabled: false },
            images: draft.images ?? [],
            videoUrls: draft.videoUrls ?? [],
            status: draft.status ?? "pending",
            city: draft.city ?? libyanCities[0]?.value ?? "Tripoli",
            area: draft.area ?? "",
            location: draft.location ?? { lat: 32.8872, lng: 13.1913 },
            contactPhone: draft.contactPhone ?? "",
            contactWhatsapp: draft.contactWhatsapp ?? "",
            condition: draft.condition,
            tags: draft.tags ?? [],
            mapUrl: draft.mapUrl ?? "",
            hideExactLocation: draft.hideExactLocation ?? false,
          });
        }
      } catch {}
    })();
  }, [user?.uid, form]);

  // ------------------ Auto-save Draft ------------------
  useEffect(() => {
    if (!user?.uid) return;
    const sub = form.watch(values => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveSaleDraft(user.uid!, values as Partial<SaleItemForm>).catch(() => {});
      }, 600);
    });
    return () => sub.unsubscribe();
  }, [user?.uid, form]);

  // ------------------ Image Preview ------------------
  useEffect(() => {
    const urls = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);

    form.setValue(
      "images",
      urls.map(u => ({ url: u })) as any,
      { shouldValidate: true }
    );

    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [selectedFiles]);

  // ------------------ Wizard Labels ------------------
  const wiz = useMemo(
    () => ({
      title: locale === "ar" ? "+Ñ+å+¦+º+í +¦+å+¦+¦ +ä+ä+¿+è+¦" : "Create Sale Item",
      subtitle: locale === "ar" ? "5 +«+++ê+º+¬ +¿+¦+è+++¬" : "5 simple steps",
      category: locale === "ar" ? "+º+ä+ü+ª+¬" : "Category",
      details: locale === "ar" ? "+º+ä+¬+ü+º+¦+è+ä" : "Details",
      location: locale === "ar" ? "+º+ä+à+ê+é+¦" : "Location",
      media: locale === "ar" ? "+º+ä+¦+ê+¦ +ê+º+ä+ü+è+»+è+ê" : "Media",
      confirm: locale === "ar" ? "+¬+ú+â+è+»" : "Confirm",
    }),
    [locale]
  );

  // ------------------ Map Marker ------------------
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: markerHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  );

  const latNum = Number(form.watch("location.lat") || 32.8872);
  const lngNum = Number(form.watch("location.lng") || 13.1913);

  // ------------------ Tap / Click Handler ------------------
  const handleMapTap = async (e: any) => {
    const { lat, lng } = e?.latlng || {};
    if (typeof lat === "number" && typeof lng === "number") {
      const latFixed = Number(lat.toFixed(6));
      const lngFixed = Number(lng.toFixed(6));

      form.setValue("location.lat", latFixed, { shouldValidate: true });
      form.setValue("location.lng", lngFixed, { shouldValidate: true });

      try {
        const lang = getLangFromDocument();
        const res = await reverseGeocodeNominatim(latFixed, lngFixed, lang);

        setSelectedAddress(res.displayName);

        const areaName = extractAreaFromDisplayName(res.displayName);
        if (areaName) {
          form.setValue("area", areaName, { shouldValidate: true });
        }
      } catch {}
    }
  };

  // ------------------ Next Button ------------------
  async function goNext() {
    const fieldsByStep: Record<typeof step, any[]> = {
      1: ["title", "price", "priceMode"],
      2: ["city", "location"],
      3: ["images"],
      4: [],
    };

    const fields = fieldsByStep[step];
    if (fields.length) {
      const ok = await form.trigger(fields as any, { shouldFocus: true });
      if (!ok) return;
    }

    setStep(s => (s >= 4 ? 4 : ((s + 1) as any)));
  }

  // ------------------ Back Button ------------------
  function goPrev() {
    setStep(s => (s <= 1 ? 1 : ((s - 1) as any)));
  }

  // ------------------ Finish ------------------
  async function handleFinish() {
    const ok = true;
    if (!ok) {
      return toast({
        variant: "destructive",
        title:
          locale === "ar"
            ? "+è+¦+¼+ë +Ñ+¦+ä+º+¡ +º+ä+¡+é+ê+ä +º+ä+à+¡+»+»+¬ +é+¿+ä +º+ä+å+¦+¦"
            : "Please fix the highlighted fields before publishing",
      });
    }

    const u = user;
    if (!u) return;

    try {
      let images = form.getValues("images");
      const mode = getUploadMode(u.uid);

      if (selectedFiles.length > 0) {
        const files = selectedFiles.slice(0, 8);

        try {
          if (mode === "storage") {
            images = await uploadSaleImages(u.uid, files);
          } else {
            const dataUrls = await Promise.all(
              files.map(f => compressToDataUrl(f, 1000, 0.7))
            );
            images = dataUrls.map(url => ({ url }));
          }
        } catch {
          const dataUrls = await Promise.all(
            files.map(f => compressToDataUrl(f, 1000, 0.7))
          );
          images = dataUrls.map(url => ({ url }));
        }

        form.setValue("images", images as any, { shouldValidate: true });
      }

      const providerName =
        userProfile?.displayName ||
        u.displayName ||
        (u.email ? u.email.split("@")[0] : null);

      const providerEmail = u.email || null;

      const values = form.getValues();
      const id = await createSaleItem({
        ...values,
        // Always start in pending state so owner console can review
        status: "pending",
        images,
        providerId: u.uid,
        providerName,
        providerEmail,
      });

      toast({
        title: locale === "ar" ? "+¬+à +Ñ+å+¦+º+í +¦+å+¦+¦ +ä+ä+¿+è+¦" : "Sale item created",
      });

      window.location.href = `/sales/${id}`;
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: e?.message || "Failed",
      });
    }
  }

  // ------------------ UI ------------------
  return (
    <div className="mx-auto max-w-3xl pt-16 md:pt-20">
      <Card>
        <CardHeader>
          <CardTitle>{wiz.title}</CardTitle>
          <CardDescription>{wiz.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="mb-2 flex items-center gap-2 text-sm">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className={`flex items-center gap-2 ${
                  step === n ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full border ${
                    step >= n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {n}
                </div>
                <span>
                  {n === 1
                    ? wiz.details
                    : n === 2
                    ? wiz.location
                    : n === 3
                    ? wiz.media
                    : wiz.confirm}
                </span>
                {n < 4 && (
                  <span className="mx-2 text-muted-foreground">GÇ¦</span>
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={e => e.preventDefault()}
              className="space-y-6"
            >
              {/* STEP 1 GÇô DETAILS */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* TYPE (category) */}
                  <div className="space-y-1">
                    <FormLabel>
                      {locale === "ar" ? "+å+ê+¦ +º+ä+¦+å+¦+¦" : "Item type"}
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => setShowTitleCategories(true)}
                      className="flex h-11 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm"
                    >
                      <span
                        className={
                          Array.isArray(form.watch("tags")) &&
                          (form.watch("tags") as string[])[0]
                            ? ""
                            : "text-muted-foreground"
                        }
                      >
                        {Array.isArray(form.watch("tags")) &&
                        (form.watch("tags") as string[])[0]
                          ? (form.watch("tags") as string[])[0]
                          : locale === "ar"
                          ? "+º+«+¬+¦ +å+ê+¦ +º+ä+¦+å+¦+¦"
                          : "Choose item type"}
                      </span>
                      <span className="text-xs text-muted-foreground">Gû+</span>
                    </button>

                    {/* GRID POPUP: big categories */}
                    {showTitleCategories && (
                      <div className="mt-2 rounded-xl border bg-popover p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {locale === "ar"
                              ? "+º+«+¬+¦ +å+ê+¦ +º+ä+¦+å+¦+¦"
                              : "Choose item category/type"}
                          </span>
                          <button
                            type="button"
                            className="rounded px-2 py-0.5 hover:bg-muted"
                            onClick={() => setShowTitleCategories(false)}
                          >
                            +ù
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {TITLE_CATEGORIES.map((cat) => {
                            const label = locale === "ar" ? cat.ar : cat.en;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const l = label.trim();
                                  // Save TYPE here (for taxonomy/search)
                                  form.setValue("tags", [l], { shouldDirty: true });
                                  setShowTitleCategories(false);
                                }}
                                className="flex flex-col items-center justify-between rounded-lg border bg-card px-2 py-3 text-center text-xs hover:bg-accent"
                              >
                                <span className="mb-1 text-2xl">{cat.icon}</span>
                                <span className="font-medium leading-snug">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NAME (item name) */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {locale === "ar" ? "+º+¦+à +º+ä+¦+å+¦+¦" : "Item name"}
                        </FormLabel>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price + Condition */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Price */}
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tr(locale, "form.labels.price")}
                          </FormLabel>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder={
                              locale === "ar" ? "+à+½+º+ä: 50" : "e.g. 50"
                            }
                            value={
                              field.value === undefined ||
                              field.value === null ||
                              field.value === 0
                                ? ""
                                : String(field.value)
                            }
                            onChange={e => {
                              const raw = e.target.value.replace(
                                /[^\d.]/g,
                                ""
                              );

                              if (raw === "") return field.onChange(null);

                              field.onChange(Number(raw));
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Condition */}
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {locale === "ar" ? "+º+ä+¡+º+ä+¬" : "Condition"}
                          </FormLabel>
                          <Select
                            value={field.value as any}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  locale === "ar"
                                    ? "+º+«+¬+¦ +º+ä+¡+º+ä+¬"
                                    : "Select condition"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                {locale === "ar" ? "+¼+»+è+»" : "New"}
                              </SelectItem>
                              <SelectItem value="like-new">
                                {locale === "ar" ? "+¦+¿+ç +¼+»+è+»" : "Like new"}
                              </SelectItem>
                              <SelectItem value="used">
                                {locale === "ar" ? "+à+¦+¬+¦+à+ä" : "Used"}
                              </SelectItem>
                              <SelectItem value="for-parts">
                                {locale === "ar" ? "+é+++¦" : "For parts"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Trade option */}
                  <FormField
                    control={form.control}
                    name="trade.enabled"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={v =>
                              field.onChange(!!v)
                            }
                          />
                          <FormLabel className="!mt-0">
                            {locale === "ar"
                              ? "+ú+é+¿+ä +º+ä+à+¿+º+»+ä+¬"
                              : "Open to trade"}
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("trade.enabled") && (
                    <FormField
                      control={form.control}
                      name="trade.tradeFor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {locale === "ar"
                              ? "+¦+ä+ë +à+º+¦+º +¬+¿+º+»+ä+ƒ"
                              : "Trade for what?"}
                          </FormLabel>
                          <Input
                            placeholder={
                              locale === "ar"
                                ? "+ç+º+¬+ü+î +ä+º+¿+¬+ê+¿+î +«+»+à+º+¬"
                                : "Phone, laptop, services"
                            }
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tr(locale, "form.labels.description")}
                        </FormLabel>
                        <Textarea rows={3} {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 3 GÇö LOCATION */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tr(locale, "form.labels.city")}
                          </FormLabel>
                          <CityPicker
                            locale={locale as any}
                            value={field.value}
                            options={libyanCities}
                            onChange={v => {
                              field.onChange(v);
                              const center = cityCenter(v);
                              if (center) {
                                const lat = Number(center.lat.toFixed(6));
                                const lng = Number(center.lng.toFixed(6));
                                form.setValue("location.lat", lat);
                                form.setValue("location.lng", lng);
                              }
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Area */}
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tr(locale, "form.labels.area")}
                          </FormLabel>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* MAP */}
                  <div className="relative mt-3 overflow-hidden rounded-[14px] border-2 border-[#D97800] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    <MapContainer
                      center={[latNum, lngNum]}
                      zoom={13}
                      scrollWheelZoom={false}
                      attributionControl={false}
                      className="cursor-crosshair"
                      style={{ height: 280, width: "100%" }}
                    >
                      <MapTapWatcher onTap={handleMapTap} />
                      <TileLayer
                        url={tileUrl}
                        attribution={tileAttribution}
                      />
                      <ScaleControl
                        imperial={false}
                        position="bottomleft"
                      />

                      <Marker
                        position={[latNum, lngNum]}
                        icon={markerIcon}
                        draggable={true}
                        eventHandlers={{
                          dragend: async (e: any) => {
                            const m = e?.target;
                            if (!m?.getLatLng) return;
                            const p = m.getLatLng();

                            const latFixed = Number(p.lat.toFixed(6));
                            const lngFixed = Number(p.lng.toFixed(6));

                            form.setValue("location.lat", latFixed);
                            form.setValue("location.lng", lngFixed);

                            try {
                              const lang = getLangFromDocument();
                              const res =
                                await reverseGeocodeNominatim(
                                  latFixed,
                                  lngFixed,
                                  lang
                                );

                              setSelectedAddress(res.displayName);

                              const areaName =
                                extractAreaFromDisplayName(
                                  res.displayName
                                );
                              if (areaName) {
                                form.setValue("area", areaName);
                              }
                            } catch {}
                          },
                        }}
                      >
                        <Popup>
                          {selectedAddress ||
                            (locale === "ar"
                              ? "+º+ä+à+ê+é+¦ +º+ä+à+¡+»+»"
                              : "Selected location")}
                        </Popup>
                      </Marker>
                    </MapContainer>
                    <div className="pointer-events-none absolute bottom-1 right-1 text-[10px] text-[#555] opacity-50">
                      @ Khidmaty & CloudAI Academy
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tr(locale, "form.labels.contactPhone")}
                          </FormLabel>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={
                              tr(
                                locale,
                                "form.placeholders.contactPhone"
                              ) as string
                            }
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
                          <FormLabel>
                            {tr(locale, "form.labels.contactWhatsapp")}
                          </FormLabel>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={
                              tr(
                                locale,
                                "form.placeholders.contactWhatsapp"
                              ) as string
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hide exact */}
                  <FormField
                    control={form.control}
                    name="hideExactLocation"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={v =>
                              field.onChange(!!v)
                            }
                          />
                          <FormLabel className="!mt-0">
                            {locale === "ar"
                              ? "+Ñ+«+ü+º+í +º+ä+à+ê+é+¦ +¦+ä+ë +º+ä+«+¦+è+++¬"
                              : "Hide exact location on map"}
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 4 GÇö MEDIA */}
              {step === 3 && (
                <div className="space-y-4">
                  <FormLabel>
                    {locale === "ar" ? "+¦+ê+¦ +º+ä+Ñ+¦+ä+º+å" : "Images"}
                  </FormLabel>

                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e =>
                      setSelectedFiles(
                        Array.from(e.target.files || []).slice(0, 8)
                      )
                    }
                  />

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                      {previews.map((src, i) => (
                        <div key={i} className="relative">
                          <img
                            src={src}
                            alt=""
                            className="h-24 w-full rounded object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5 GÇö CONFIRM */}
              {step === 4 && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "+¦+º+¼+¦ +º+ä+¬+ü+º+¦+è+ä +½+à +º+å+¦+¦"
                    : "Review details then publish"}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  disabled={step <= 1}
                >
                  {locale === "ar" ? "+¦+¼+ê+¦" : "Back"}
                </Button>

                {step < 4 ? (
                  <Button type="button" onClick={goNext}>
                    {locale === "ar" ? "+º+ä+¬+º+ä+è" : "Next"}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleFinish}>
                    {locale === "ar" ? "+å+¦+¦" : "Publish"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
