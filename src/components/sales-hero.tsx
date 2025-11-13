"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getClientLocale } from "@/lib/i18n";

export default function SalesHero() {
  const locale = getClientLocale();
  const isAr = locale === "ar";

  return (
    <section className="bg-gradient-to-b from-[#2a1200] to-transparent pb-6 pt-10">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h1 className="mb-2 font-headline text-3xl text-foreground md:text-4xl lg:text-5xl">
          {isAr
            ? "اعثر على إعلانات محلية موثوقة"
            : "Find trusted local listings"}
        </h1>

        <p className="mb-6 text-sm text-foreground/80 md:text-base">
          {isAr
            ? "صلتك بالبائعين والخدمات الموثوقة في ليبيا."
            : "Your connection to trusted sellers and services in Libya."}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {/* search / browse listings */}
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/sales">
              {isAr
                ? "أنا باحث عن إعلان – اعثر على الإعلانات"
                : "I’m looking – browse listings"}
            </Link>
          </Button>

          {/* create listing */}
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-5 bg-background/70"
          >
            <Link href="/sales/create">
              {isAr
                ? "أنا مقدم إعلان – أدرج إعلاني"
                : "I’m a seller – post my ad"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
