"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/service-card";
import SaleCard from "@/components/SaleCard";
import { Play, Search, MapPin, Shield, Smartphone, GraduationCap, Droplet } from "lucide-react";
import { getClientLocale } from "@/lib/i18n";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { listTopViewedServices, type Service } from "@/lib/services";
import { listTopViewedSaleItems, type SaleItem } from "@/lib/sale-items";

/* ---------------------------------------------------
   1) SIMPLE VIDEO HELPERS
--------------------------------------------------- */

const FALLBACK_VIDEOS = ["https://www.youtube.com/embed/3WpTyA3OkYw"];

function buildEmbedUrl(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";

  const id =
    v.match(/youtu\.be\/([\w-]+)/i)?.[1] ||
    v.match(/[?&]v=([\w-]+)/i)?.[1] ||
    v.match(/\/embed\/([\w-]+)/i)?.[1] ||
    v.match(/\/shorts\/([\w-]+)/i)?.[1];

  if (id) {
    return `https://www.youtube.com/embed/${id}`;
  }
  return v;
}

function youtubeThumbFromUrl(raw: string): string {
  try {
    const v = buildEmbedUrl(raw);
    const m = v.match(/\/embed\/([\w-]+)/i);
    const id = m?.[1];
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch {}
  return "https://placehold.co/320x180?text=Video";
}

/* ---------------------------------------------------
   2) HOOK: Fetch landing videos from Firestore
--------------------------------------------------- */

function useLandingVideos() {
  const [videos, setVideos] = useState<string[]>(FALLBACK_VIDEOS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, "settings", "home");
        const snap = await getDoc(ref);
        const arr =
          (snap.exists()
            ? (snap.get("landingVideoUrls") as string[] | undefined)
            : undefined) || [];

        const cleaned = Array.isArray(arr)
          ? arr
              .map((v) => String(v || "").trim())
              .filter((v) => v.length > 0)
              .slice(0, 20)
          : [];

        if (!cancelled && cleaned.length > 0) {
          setVideos(cleaned);
        }
      } catch {
        // ignore and fallback stays
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return videos;
}

type TopBook = {
  id: string;
  title: string;
  author?: string;
  readCount: number;
};

type TopBloodDonation = {
  id: string;
  title: string;
  city?: string;
  bloodType?: string;
  responseCount: number;
};

async function fetchTopBooks(): Promise<TopBook[]> {
  try {
    const res = await fetch("/api/books/top", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json?.items) ? (json.items as TopBook[]) : [];
  } catch {
    return [];
  }
}

async function fetchTopBloodDonation(): Promise<TopBloodDonation[]> {
  try {
    const res = await fetch("/api/blood-donors/top", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json?.items) ? (json.items as TopBloodDonation[]) : [];
  } catch {
    return [];
  }
}

function TopGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-background/60 p-3 shadow-sm">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-4 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------
   3) HOME PAGE
--------------------------------------------------- */

export default function Home() {
  const locale = getClientLocale();
  const isAr = locale === "ar";
  const videos = useLandingVideos();

  // WHICH VIDEO IS ACTIVE
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = activeIndex < videos.length ? activeIndex : 0;

  const [topServices, setTopServices] = useState<Service[]>([]);
  const [topServicesLoading, setTopServicesLoading] = useState(true);
  const [topSales, setTopSales] = useState<SaleItem[]>([]);
  const [topSalesLoading, setTopSalesLoading] = useState(true);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [topBooksLoading, setTopBooksLoading] = useState(true);
  const [topBloodDonation, setTopBloodDonation] = useState<TopBloodDonation[]>([]);
  const [topBloodDonationLoading, setTopBloodDonationLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTopServicesLoading(true);
        const rows = await listTopViewedServices(10);
        if (!cancelled) setTopServices(rows);
      } catch {
        if (!cancelled) setTopServices([]);
      } finally {
        if (!cancelled) setTopServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTopSalesLoading(true);
        const rows = await listTopViewedSaleItems(10);
        if (!cancelled) setTopSales(rows);
      } catch {
        if (!cancelled) setTopSales([]);
      } finally {
        if (!cancelled) setTopSalesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTopBooksLoading(true);
        const rows = await fetchTopBooks();
        if (!cancelled) setTopBooks(rows.slice(0, 10));
      } catch {
        if (!cancelled) setTopBooks([]);
      } finally {
        if (!cancelled) setTopBooksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTopBloodDonationLoading(true);
        const rows = await fetchTopBloodDonation();
        if (!cancelled) setTopBloodDonation(rows.slice(0, 10));
      } catch {
        if (!cancelled) setTopBloodDonation([]);
      } finally {
        if (!cancelled) setTopBloodDonationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryVideo = buildEmbedUrl(
    videos[safeIndex] ?? videos[0] ?? FALLBACK_VIDEOS[0]
  );

  const hasVideo = !!primaryVideo;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1" dir={isAr ? "rtl" : "ltr"}>
        {/* ------------------------------------------------------------
            HERO SECTION
        ------------------------------------------------------------ */}
        <section className="border-b bg-gradient-to-b from-background via-background to-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:py-16">
            {/* LEFT TEXT */}
            <div
              className={`flex-1 space-y-6 ${
                isAr ? "md:pl-10 text-right" : "md:pr-10 text-left"
              }`}
            >
             <div className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-4 py-1.5 text-xs md:text-sm font-semibold text-primary shadow-sm">
  <Shield className="h-4 w-4" />
  <span>
    {isAr
      ? "منصة موثوقة للخدمات والبيع في ليبيا"
      : "Trusted platform for services and sales in Libya"}
  </span>
</div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {isAr
                  ? "اعثر على الخدمات والبيع بسهولة واطمئنان"
                  : "Find services and items near you with confidence"}
              </h1>

                <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                  {isAr
                  ? "خدمتي تجمع بين مقدّمي الخدمات والأشخاص الذين يبحثون عن بيع أو شراء في مكان واحد منظم، بعيداً عن فوضى منشورات وسائل التواصل الاجتماعي."
                  : "Khidmaty brings providers and seekers together in one organised place, away from the noise of social media posts."}
                </p>

              <div
                className={`flex flex-wrap gap-3 ${
                  isAr ? "justify-end" : "justify-start"
                }`}
              >
                <Button size="lg" className="gap-2 px-6 text-base" asChild>
                  <Link href="/services">
                    {isAr ? "تصفح الخدمات" : "Browse services"}
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-6 text-base bg-black text-white hover:bg-black/90"
                  asChild
                >
                  <Link href="/sales">
                    {isAr ? "تصفح البيع والتجارة" : "Browse sales & trade"}
                  </Link>
                </Button>
              </div>

              <div
                className={`mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground ${
                  isAr ? "justify-end" : "justify-start"
                }`}
              >
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {isAr
                    ? "إعلانات حقيقية خاضعة للمراجعة"
                    : "Real, moderated listings"}
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {isAr
                    ? "ابحث حسب المدينة، التصنيف والموقع على الخريطة"
                    : "Search by city, category and map location"}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------
                RIGHT: HERO VIDEO
            ------------------------------------------------------------ */}
            <div className="flex-1">
              <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black/80 shadow-xl">
                {hasVideo ? (
                  <iframe
                    src={primaryVideo}
                    title="Khidmaty intro"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Play className="h-6 w-6" />
                    </div>
                    <p>{isAr ? "لا يوجد فيديو متاح" : "No video available"}</p>
                  </div>
                )}
              </div>

              {/* SMALL THUMBNAIL STRIP */}
              {videos.length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {videos.map((v, idx) => {
                    if (idx === safeIndex) return null;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className="relative h-24 w-40 flex-none overflow-hidden rounded-xl border bg-black/80 shadow-sm"
                      >
                        <img
                          src={youtubeThumbFromUrl(v)}
                          alt={`Video ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                          <Play className="mr-1 h-4 w-4" />
                          {isAr ? "تشغيل" : "Play"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            SECTION #2: MOST VIEWED SERVICES
        ------------------------------------------------------------ */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <div
              className={`flex items-center justify-between ${
                isAr ? "flex-row-reverse text-right" : "text-left"
              }`}
            >
              <h2 className="flex items-baseline gap-2 text-xl font-bold md:text-2xl">
                <span>{isAr ? "الخدمات الأكثر مشاهدة" : "Most Viewed Services"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {isAr ? "أفضل 10" : "Top 10"}
                </span>
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/services">{isAr ? "عرض الكل" : "View all"}</Link>
              </Button>
            </div>

            <div className="mt-6">
              {topServicesLoading ? (
                <TopGridSkeleton />
              ) : topServices.length === 0 ? (
                <div
                  className={`rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  لا توجد بيانات بعد
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {topServices.map((s: any, idx: number) => (
                      <ServiceCard
                        key={s?.id || idx}
                        id={s?.id}
                        title={String(s?.title || "")}
                        category={String(s?.category || "general")}
                        city={String(s?.city || "")}
                        price={Number(s?.price || 0)}
                        priceMode={s?.priceMode}
                        imageUrl={
                          Array.isArray(s?.images) && s.images[0]?.url
                            ? s.images[0].url
                            : "https://placehold.co/800x600.png?text=Service"
                        }
                        aiHint={`category:${String(s?.category || "")}; city:${String(
                          s?.city || ""
                        )}`}
                        href={s?.id ? `/services/${s.id}` : undefined}
                      />
                    ))}
                  </div>
                  {topServices.length < 10 && (
                    <p
                      className={`mt-4 text-sm text-muted-foreground ${
                        isAr ? "text-right" : "text-left"
                      }`}
                    >
                      لا توجد بيانات بعد
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            SECTION #3: MOST VIEWED SALES
        ------------------------------------------------------------ */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <div
              className={`flex items-center justify-between ${
                isAr ? "flex-row-reverse text-right" : "text-left"
              }`}
            >
              <h2 className="flex items-baseline gap-2 text-xl font-bold md:text-2xl">
                <span>{isAr ? "الأكثر مشاهدة في البيع" : "Most Viewed Sales"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {isAr ? "أفضل 10" : "Top 10"}
                </span>
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/sales">{isAr ? "عرض الكل" : "View all"}</Link>
              </Button>
            </div>

            <div className="mt-6">
              {topSalesLoading ? (
                <TopGridSkeleton />
              ) : topSales.length === 0 ? (
                <div
                  className={`rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  لا توجد بيانات بعد
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {topSales.map((item: any, idx: number) => (
                      <SaleCard key={item?.id || idx} item={item} />
                    ))}
                  </div>
                  {topSales.length < 10 && (
                    <p
                      className={`mt-4 text-sm text-muted-foreground ${
                        isAr ? "text-right" : "text-left"
                      }`}
                    >
                      لا توجد بيانات بعد
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            SECTION #4: MOST READ BOOKS
        ------------------------------------------------------------ */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <div className={isAr ? "text-right" : "text-left"}>
              <h2 className="flex items-baseline gap-2 text-xl font-bold md:text-2xl">
                <span>{isAr ? "الكتب الأكثر قراءة" : "Most Read Books"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {isAr ? "أفضل 10" : "Top 10"}
                </span>
              </h2>
            </div>

            <div
              className={`mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
                isAr ? "md:flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex flex-wrap gap-2 text-[11px] md:text-xs ${
                  isAr ? "justify-end" : "justify-start"
                }`}
              >
                <Link
                  href="/student-bank"
                  className="rounded-full bg-amber-100 px-3 py-1 text-amber-900"
                >
                  {isAr ? "بنك موارد الطلبة" : "Student resource bank"}
                </Link>
                <Link
                  href="/student-bank"
                  className="rounded-full bg-amber-100 px-3 py-1 text-amber-900"
                >
                  {isAr ? "دعم أكاديمي وبحثي" : "Academic & research support"}
                </Link>
                <Link
                  href="/student-bank"
                  className="rounded-full bg-amber-100 px-3 py-1 text-amber-900"
                >
                  {isAr ? "سيرة ذاتية وتوظيف" : "CV & job applications"}
                </Link>
                <Link
                  href="/student-bank"
                  className="rounded-full bg-amber-100 px-3 py-1 text-amber-900"
                >
                  {isAr ? "ترجمة وتدقيق لغوي" : "Translation & proofreading"}
                </Link>
              </div>

              <Button
                size="sm"
                className="bg-amber-500 text-white hover:bg-amber-600"
                asChild
              >
                <Link href="/student-bank">
                  {isAr ? "استكشف ركن الطلبة" : "Explore Student Resource Bank"}
                </Link>
              </Button>
            </div>

            <div className="mt-6">
              {topBooksLoading ? (
                <TopGridSkeleton />
              ) : topBooks.length === 0 ? (
                <div
                  className={`rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  لا توجد بيانات بعد
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {topBooks.map((b, idx) => (
                      <Link
                        key={b?.id || idx}
                        href="/student-bank"
                        className="block"
                      >
                        <div className="group rounded-2xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                          <div className="text-sm font-semibold line-clamp-2">
                            {b.title}
                          </div>
                          {b.author && (
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                              {b.author}
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground">
                            {isAr ? "القراءات" : "Reads"}:{" "}
                            {Number(b.readCount || 0).toLocaleString()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {topBooks.length < 10 && (
                    <p
                      className={`mt-4 text-sm text-muted-foreground ${
                        isAr ? "text-right" : "text-left"
                      }`}
                    >
                      لا توجد بيانات بعد
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            SECTION #5: MOST RESPONDED BLOOD DONATION
        ------------------------------------------------------------ */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <div className={isAr ? "text-right" : "text-left"}>
              <h2 className="flex items-baseline gap-2 text-xl font-bold md:text-2xl">
                <span>
                  {isAr
                    ? "الأكثر تفاعلاً للتبرع بالدم"
                    : "Most Responded Blood Donation"}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {isAr ? "أفضل 10" : "Top 10"}
                </span>
              </h2>
            </div>

            <div
              className={`mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
                isAr ? "md:flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex flex-wrap gap-2 text-[11px] md:text-xs ${
                  isAr ? "justify-end" : "justify-start"
                }`}
              >
                <Link
                  href="/blood-donors"
                  className="rounded-full bg-rose-100 px-3 py-1 text-rose-900"
                >
                  {isAr ? "متبرعي الدم" : "Blood donors"}
                </Link>
                <Link
                  href="/blood-donors"
                  className="rounded-full bg-rose-100 px-3 py-1 text-rose-900"
                >
                  {isAr ? "الأنواع النادرة" : "Rare blood types"}
                </Link>
                <Link
                  href="/blood-donors"
                  className="rounded-full bg-rose-100 px-3 py-1 text-rose-900"
                >
                  {isAr ? "جهات اتصال موثوقة" : "Trusted contact details"}
                </Link>
              </div>

              <Button
                size="sm"
                className="bg-rose-500 text-white hover:bg-rose-600"
                asChild
              >
                <Link href="/blood-donors">
                  {isAr ? "استكشف خدمة متبرعي الدم" : "Explore blood donors"}
                </Link>
              </Button>
            </div>

            <div className="mt-6">
              {topBloodDonationLoading ? (
                <TopGridSkeleton />
              ) : topBloodDonation.length === 0 ? (
                <div
                  className={`rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  لا توجد بيانات بعد
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {topBloodDonation.map((d, idx) => (
                      <Link
                        key={d?.id || idx}
                        href="/blood-donors"
                        className="block"
                      >
                        <div className="group rounded-2xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                          <div className="text-sm font-semibold line-clamp-2">
                            {d.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {[
                              d.city ? String(d.city) : null,
                              d.bloodType ? String(d.bloodType) : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            {isAr ? "عدد التفاعلات" : "Responses"}:{" "}
                            {Number(d.responseCount || 0).toLocaleString()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {topBloodDonation.length < 10 && (
                    <p
                      className={`mt-4 text-sm text-muted-foreground ${
                        isAr ? "text-right" : "text-left"
                      }`}
                    >
                      لا توجد بيانات بعد
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {false && (
          <>
            {/* ------------------------------------------------------------
                STUDENT RESOURCE BANK TEASER
            ------------------------------------------------------------ */}
            <section className="border-b bg-gradient-to-r from-amber-50 via-amber-100/60 to-background">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div
              className={`relative overflow-hidden rounded-2xl border border-amber-200/70 bg-card/90 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm ${
                isAr ? "text-right" : "text-left"
              }`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

              <div
                className={`relative flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-7 ${
                  isAr ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Left: icon + text */}
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span>
                      {isAr ? "ركن الطلبة الجديد" : "New • Student Resource Bank"}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold md:text-xl">
                    {isAr
                      ? "امتحانات، مذكرات، دعم أكاديمي وسيرة ذاتية"
                      : "Study resources, academic support & CV help"}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                    {isAr
                      ? "شارك الامتحانات السابقة، الواجبات، المذكرات والتقارير، واستفد من دعم أكاديمي ومساعدة في السيرة الذاتية والترجمة."
                      : "Share past exams, assignments, notes and reports, and get help with research, CVs and academic translation."}
                  </p>

                  <div
                    className={`mt-4 flex flex-wrap gap-2 text-[11px] md:text-xs ${
                      isAr ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      {isAr ? "بنك موارد الطلبة" : "Student resource bank"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      {isAr ? "دعم أكاديمي وبحثي" : "Academic & research support"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      {isAr ? "سيرة ذاتية وتوظيف" : "CV & job applications"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      {isAr ? "ترجمة وتدقيق لغوي" : "Translation & proofreading"}
                    </span>
                  </div>
                </div>

                {/* Right: bullets + CTA */}
                <div className="flex flex-1 flex-col justify-between gap-3 text-xs text-muted-foreground md:text-sm">
                  <ul className={`space-y-1 ${isAr ? "ml-6 list-disc text-right" : "mr-6 list-disc text-left"}`}>
                    <li>
                      {isAr
                        ? "امتحانات سابقة، واجبات، مذكرات وتقارير نموذجية لجامعات مختلفة."
                        : "Past exams, assignments, notes and sample reports from different universities."}
                    </li>
                    <li>
                      {isAr
                        ? "مساعدة في المقترحات، مراجعة الأدبيات، والتحضير للبحوث والتقارير."
                        : "Help with proposals, literature reviews and preparing reports or research."}
                    </li>
                    <li>
                      {isAr
                        ? "مراجعة CV، خطابات التغطية، وطلبات المنح والقبول الجامعي."
                        : "CV review, cover letter feedback and scholarship/college applications."}
                    </li>
                    <li>
                      {isAr
                        ? "ترجمة أكاديمية عربية ⇄ إنجليزية مع تدقيق لغوي."
                        : "Academic AR ⇄ EN translation with grammar and clarity checks."}
                    </li>
                  </ul>

                  <div
                    className={`mt-3 flex ${
                      isAr ? "justify-start md:justify-start" : "justify-end md:justify-end"
                    }`}
                  >
                    <Button
                      size="sm"
                      className="bg-amber-500 text-white hover:bg-amber-600"
                      asChild
                    >
                      <Link href="/student-bank">
                        {isAr ? "استكشف ركن الطلبة" : "Explore Student Resource Bank"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            BLOOD DONOR TEASER
        ------------------------------------------------------------ */}
        <section className="border-b bg-gradient-to-r from-rose-50 via-rose-100/60 to-background">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div
              className={`relative overflow-hidden rounded-2xl border border-rose-200/70 bg-card/90 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm ${
                isAr ? "text-right" : "text-left"
              }`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-300/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

              <div
                className={`relative flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-7 ${
                  isAr ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Left: icon + text */}
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-400/60 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 shadow-sm">
                    <Droplet className="h-4 w-4" />
                    <span>
                     {isAr
  ? "خدمة جديدة — متبرعي الدم والأنواع النادرة"
  : "New — Blood donors & rare types"}

                    </span>
                  </div>
                  <h2 className="text-lg font-bold md:text-xl">
                    {isAr
                      ? "متبرعي الدم والأنواع النادرة"
                      : "Blood donors and rare blood types"}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                    {isAr
                      ? "ساعد في إنقاذ الأرواح عن طريق التسجيل كمتبرع بالدم أو البحث عن متبرعين حسب فصيلة الدم، المدينة، والأنواع النادرة."
                      : "Help save lives by registering as a blood donor or searching for donors by type, city and rare groups."}
                  </p>

                  <div
                    className={`mt-4 flex flex-wrap gap-2 text-[11px] md:text-xs ${
                      isAr ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
                      {isAr ? "متبرعي الدم" : "Blood donors"}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
                      {isAr ? "الأنواع النادرة" : "Rare blood types"}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
                      {isAr ? "جهات اتصال موثوقة" : "Trusted contact details"}
                    </span>
                  </div>
                </div>

                {/* Right: bullets + CTA */}
                <div className="flex flex-1 flex-col justify-between gap-3 text-xs text-muted-foreground md:text-sm">
                  <ul
                    className={`space-y-1 ${
                      isAr ? "ml-6 list-disc text-right" : "mr-6 list-disc text-left"
                    }`}
                  >
                    <li>
                      {isAr
                        ? "بحث سريع عن متبرعين حسب فصيلة الدم والمدينة."
                        : "Quickly search for donors by blood type and city."}
                    </li>
                    <li>
                      {isAr
                        ? "تمييز الفصائل النادرة لتسهيل الوصول إليها في الحالات الطارئة."
                        : "Highlight rare types to make them easier to find in emergencies."}
                    </li>
                    <li>
                      {isAr
                        ? "إمكانية تسجيل نفسك كمتبرع وتحديث بياناتك لاحقًا."
                        : "Register yourself as a donor and update your details later."}
                    </li>
                  </ul>

                  <div
                    className={`mt-3 flex ${
                      isAr ? "justify-start md:justify-start" : "justify-end md:justify-end"
                    }`}
                  >
                    <Button
                      size="sm"
                      className="bg-rose-500 text-white hover:bg-rose-600"
                      asChild
                    >
                      <Link href="/blood-donors">
                        {isAr ? "استكشف خدمة متبرعي الدم" : "Explore blood donors"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
          </>
        )}

        {/* ------------------------------------------------------------
            HOW IT WORKS
        ------------------------------------------------------------ */}
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div
            className={`mb-6 flex flex-col gap-2 ${
              isAr ? "items-end text-right" : "items-start text-left"
            }`}
          >
            <h2 className="text-xl font-bold md:text-2xl">
              {isAr
                ? "كيف تعمل خدمتي؟"
                : "How does Khidmaty work?"}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {isAr
                ? "اختر القسم، ابحث أو أنشئ إعلانك، ثم تواصل مباشرة."
                : "Choose a category, search or publish your listing, then contact directly."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr ? "اختر القسم" : "Choose category"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "تصفح الخدمات أو البيع والتجارة بسهولة."
                  : "Browse services or sales & trade easily."}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr ? "فلترة ذكية بالموقع" : "Smart location filtering"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "ابحث حسب المدينة، التصنيف والموقع على الخريطة."
                  : "Search by city, category, and map location."}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr ? "تواصل آمن" : "Safe contact"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "تواصل عبر الهاتف، الواتساب أو الدردشة."
                  : "Contact via phone, WhatsApp or chat."}
              </p>
            </div>
          </div>

          {/* MOBILE NOTE */}
          <div className="mt-8 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground md:text-sm">
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                {isAr ? "مصمم للجوال" : "Designed for mobile"}
              </span>
            </div>
            <p>
              {isAr
                ? "يمكنك إنشاء إعلانك بسهولة من الجوال."
                : "You can create your listing easily from your phone."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
