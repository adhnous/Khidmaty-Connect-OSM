"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Search, MapPin, Shield, Smartphone } from "lucide-react";
import { getClientLocale } from "@/lib/i18n";

const VIDEO_EMBED_URL = "https://www.youtube.com/embed/3WpTyA3OkYw";

export default function Home() {
  const locale = getClientLocale();
  const isAr = locale === "ar";
  const hasVideo = !VIDEO_EMBED_URL.includes("YOUR_VIDEO_ID_HERE");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-background via-background to-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:py-16">
            <div
              className={`flex-1 space-y-6 ${
                isAr ? "md:pl-10 text-right" : "md:pr-10 text-left"
              }`}
            >
              <div className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                {isAr
                  ? "منصّة موثوقة للخدمات والبيع في ليبيا"
                  : "Trusted services and sales in Libya"}
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {isAr
                  ? "اعثر على الخدمات والبيع بسهولة واطمئنان"
                  : "Find services and items near you with confidence"}
              </h1>

              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                {isAr
                  ? "خدمتي كونكت تجمع بين مقدّمي الخدمات والأشخاص الذين يبحثون عن بيع أو شراء في مكان واحد منظم، بعيداً عن فوضى منشورات السوشيال ميديا."
                  : "Khidmaty Connect brings providers and seekers together in one organised place, away from the noise of social media posts."}
              </p>

              <div
                className={`flex flex-wrap gap-3 ${
                  isAr ? "justify-end" : "justify-start"
                }`}
              >
                <Button
                  size="lg"
                  className="gap-2 px-6 text-base"
                  asChild
                >
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
                    ? "إعلانات حقيقية ومعتدلة، وليست منشورات عشوائية"
                    : "Real, moderated listings – not random posts"}
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {isAr
                    ? "بحث حسب المدينة، القسم، والموقع على الخريطة"
                    : "Search by city, category and map location"}
                </div>
              </div>
            </div>

            {/* Video / preview */}
            <div className="flex-1">
              <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black/80 shadow-xl">
                {hasVideo ? (
                  <iframe
                    src={VIDEO_EMBED_URL}
                    title="Khidmaty Connect intro"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Play className="h-6 w-6" />
                    </div>
                    <p>
                      {isAr
                        ? "يمكنك إضافة رابط فيديو يوتيوب تعريفي بالتطبيق هنا."
                        : "Place your YouTube intro video link here."}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {isAr
                        ? "عدّل المتغيّر VIDEO_EMBED_URL في src/app/page.tsx."
                        : "Edit VIDEO_EMBED_URL in src/app/page.tsx to show your video."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div
            className={`mb-6 flex flex-col gap-2 ${
              isAr ? "items-end text-right" : "items-start text-left"
            }`}
          >
            <h2 className="text-xl font-bold md:text-2xl">
              {isAr
                ? "كيف تعمل خدمتي كونكت؟"
                : "How does Khidmaty Connect work?"}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {isAr
                ? "في ثلاث خطوات بسيطة: اختر القسم، ابحث أو أنشئ إعلانك، ثم تواصل مباشرة عبر الهاتف أو واتساب أو المحادثة داخل التطبيق."
                : "In three simple steps: choose a category, search or publish your listing, then contact directly via phone, WhatsApp, or in‑app chat."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr ? "اختر بين الخدمات أو البيع" : "Choose services or sales"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "من الصفحة الرئيسية تنتقل مباشرة إلى تصفح الخدمات أو إعلانات البيع والتجارة."
                  : "From the landing page you go straight to either services or sales & trade."}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr
                  ? "فلترة ذكية حسب الموقع والمدينة"
                  : "Smart filters by city and location"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "استخدم المدينة، القسم، الحالة، والخريطة لرؤية الإعلانات والخدمات القريبة منك."
                  : "Use city, category, condition and the map to see listings and services near you."}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">
                {isAr ? "تواصل آمن ومباشر" : "Safe, direct contact"}
              </h3>
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? "كل إعلان يحتوي على وسيلة تواصل واضحة: هاتف، واتساب، أو محادثة داخلية، مع لوحة تحكم للمالك لمراجعة الإعلانات."
                  : "Every listing includes clear contact options and an owner console to moderate and approve content."}
              </p>
            </div>
          </div>

          {/* Mobile-friendly reminder */}
          <div className="mt-8 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground md:text-sm">
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                {isAr ? "مصمّم ليعمل جيداً على الجوال" : "Designed for mobile first"}
              </span>
            </div>
            <p>
              {isAr
                ? "كل الصفحات – من البحث إلى إنشاء الإعلان – تم ضبطها لتعمل بسلاسة على شاشة الهاتف، لتتمكّن من تصوير ورفع إعلانك في ثوانٍ."
                : "Every step, from searching to creating a listing, is tuned for phone screens so you can capture and publish in seconds."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

