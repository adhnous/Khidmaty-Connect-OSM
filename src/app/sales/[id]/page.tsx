"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MediaGallery from "@/components/media-gallery";
import StarRating from "@/components/star-rating";
import { MapPin, Share2 } from "lucide-react";
import { getClientLocale, tr } from "@/lib/i18n";
import { getSaleItemById, type SaleItem } from "@/lib/sale-items";
import ServiceMap from "@/components/service-map";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = getClientLocale();
  const [item, setItem] = useState<SaleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id || Array.isArray(id)) return;
      setLoading(true);
      try {
        const doc = await getSaleItemById(id);
        if (!doc) setNotFound(true);
        else setItem(doc);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const priceLabel = useMemo(() => {
    const mode = String((item as any)?.priceMode || "firm");
    const price = Number((item as any)?.price || 0);
    if (mode === "call") return locale === "ar" ? "اتصل لمعرفة السعر" : "Call for price";
    if (mode === "negotiable") return `${locale === "ar" ? "LYD" : "LYD"} ${price} ${locale === "ar" ? "(قابل للتفاوض)" : "(Negotiable)"}`;
    if (mode === "hidden") return "";
    return `${locale === "ar" ? "LYD" : "LYD"} ${price}`;
  }, [item?.priceMode, item?.price, locale]);

  const conditionLabel = useMemo(() => {
    const raw = String((item as any)?.condition || "");
    const m: Record<string, string> = {
      new: locale === "ar" ? "جديد" : "New",
      "like-new": locale === "ar" ? "شبه جديد" : "Like new",
      used: locale === "ar" ? "مستعمل" : "Used",
      "for-parts": locale === "ar" ? "قطع" : "For parts",
    };
    return m[raw] || (locale === "ar" ? "مبيعات" : "Sales");
  }, [item?.condition, locale]);

  const coords = useMemo(() => {
    const lat = Number((item as any)?.location?.lat ?? NaN);
    const lng = Number((item as any)?.location?.lng ?? NaN);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }, [item?.location]);

  async function handleShare() {
    if (!item?.id) return;
    try {
      setSharing(true);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/sales/${item.id}`;
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          await (navigator as any).share({ title: item.title, text: item.title, url });
          return;
        } catch {}
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-muted-foreground">{tr(locale, "details.loading")}</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">{tr(locale, "details.notFoundTitle")}</h1>
        <p className="mb-4 text-muted-foreground">{tr(locale, "details.notFoundBodyRemoved")}</p>
        <Link href="/sales" className="underline">{locale === "ar" ? "عودة إلى السوق" : "Back to Sales"}</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <Card className="mb-6 md:w-2/3 mx-auto">
              <CardContent className="p-3 md:p-4">
                <MediaGallery
                  title={item.title}
                  images={((item as any)?.images || []) as any}
                  videoEmbedUrl={null}
                  videoEmbedUrls={((item as any)?.videoUrls || []) as any}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 md:w-2/3 mx-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-3xl font-bold font-headline md:text-4xl">
                  {item.title}
                </CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <Badge variant="secondary" className="text-base ps-2 pe-2">
                    {conditionLabel}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {item.city}{item.area ? `، ${item.area}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StarRating value={Math.round(Number((item as any)?.rating || 0))} readOnly size="md" />
                    <span className="text-sm">({Number((item as any)?.reviewsCount || 0)})</span>
                  </div>
                </div>
                {priceLabel && (
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-primary">{priceLabel}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {(item as any)?.trade?.enabled && (
                  <div className="mb-3">
                    <Badge variant="outline" className="me-2">{locale === "ar" ? "مفتوح للمبادلة" : "Open to trade"}</Badge>
                    {((item as any)?.trade?.tradeFor) && (
                      <span className="text-sm text-muted-foreground">{(item as any).trade.tradeFor}</span>
                    )}
                  </div>
                )}
                {item.description && (
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold font-headline mb-2">
                      {tr(locale, "details.description")}
                    </h2>
                    <p className="whitespace-pre-wrap text-lg text-foreground/80">
                      {item.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location map */}
            {coords && (item as any)?.hideExactLocation !== true && (
              <Card className="mb-6 md:w-2/3 mx-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold font-headline">
                    {tr(locale, "details.location")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {tr(locale, "details.approxIn")} {item.city}
                      {item.area ? `, ${item.area}` : ""}.
                    </div>
                    <ServiceMap lat={coords.lat} lng={coords.lng} title={item.title} city={item.city} area={item.area} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-24 mb-6">
              <CardContent className="flex flex-col gap-3 p-4">
                <Button size="lg" className="h-12 w-full text-lg" onClick={handleShare} disabled={sharing}>
                  <Share2 className="mr-2" /> {locale === "ar" ? "مشاركة" : "Share"}
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full text-lg">
                  <Link href="/sales">{locale === "ar" ? "عودة إلى السوق" : "Back to Sales"}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
