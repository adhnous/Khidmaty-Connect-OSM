"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getClientLocale } from "@/lib/i18n";
import { Wrench, ShoppingBag } from "lucide-react";

export default function AddListingChooserPage() {
  const locale = getClientLocale();
  const isAr = locale === "ar";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-background to-background">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1
            className={`mb-3 text-2xl font-bold md:text-3xl ${
              isAr ? "text-right" : "text-left"
            }`}
          >
            {isAr ? "اختر ما تريد إنشاؤه" : "What would you like to add?"}
          </h1>

          <p
            className={`mb-8 max-w-2xl text-sm text-muted-foreground ${
              isAr ? "text-right" : "text-left"
            }`}
          >
            {isAr
              ? "سجّل خدمتك أو متجرك أو منتجاتك ليظهر عرضك لعملاء قريبين منك، ونقترحها لهم عندما يبحثون عن خدمات أو عناصر في نفس المنطقة."
              : "Register your service, shop, or items so people near you can discover you and get recommendations when they search for nearby services or sale items."}
          </p>

          <div className="grid gap-6 md:grid-cols-2 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-card to-amber-100/80 p-4 shadow-[0_22px_45px_rgba(245,158,11,0.22)]">
            {/* Service card */}
            <Card className="relative h-full overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10 shadow-lg shadow-primary/25 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/35">
              <CardHeader className={isAr ? "text-right" : ""}>
                <CardTitle className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Wrench className="h-5 w-5 text-primary" />
                  </span>
                  <span>
                    {isAr ? "إنشاء خدمة أو متجر" : "Create a service or shop"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}
              >
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "سجّل خدمتك أو متجرك مع الوصف والموقع وطرق التواصل، ليظهر في صفحة الخدمات في مدينتك ونوصي به تلقائياً للزبائن القريبين منك."
                    : "Register your service or shop with description, pricing, location, and contact details so it appears in your city and is recommended to nearby customers."}
                </p>
                <Button asChild className="w-full">
                  <Link href="/create">
                    {isAr ? "ابدأ إنشاء الخدمة" : "Start service wizard"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Sale item card */}
            <Card className="relative h-full overflow-hidden border border-amber-300/70 bg-gradient-to-br from-amber-50 via-card to-amber-100 shadow-lg shadow-amber-200/60 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-300/80">
              <CardHeader className={isAr ? "text-right" : ""}>
                <CardTitle className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </span>
                  <span>
                    {isAr ? "إنشاء عنصر للبيع" : "Create an item for sale"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}
              >
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "اعرض سيارتك أو عقارك أو أي سلعة أخرى للبيع أو التبديل، ليظهر إعلانك للمشترين القريبين وفي نتائج البحث المرتبطة بنوع العنصر."
                    : "List a car, property, or any other item for sale or trade so your listing is visible to nearby buyers and in relevant searches."}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/sales/create">
                    {isAr ? "ابدأ إنشاء إعلان البيع" : "Start sales wizard"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
