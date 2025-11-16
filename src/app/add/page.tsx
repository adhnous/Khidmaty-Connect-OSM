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
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1
            className={`mb-6 text-2xl font-bold md:text-3xl ${
              isAr ? "text-right" : "text-left"
            }`}
          >
            {isAr ? "اختر ما تريد إنشاءه" : "What do you want to create?"}
          </h1>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Service card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className={isAr ? "text-right" : ""}>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span>
                    {isAr ? "إنشاء خدمة جديدة" : "Create a service"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}
              >
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "أضف خدمة مهنية أو تجارية مع الوصف والسعر والموقع."
                    : "Add a professional or business service with description, price and location."}
                </p>
                <Button asChild className="w-full">
                  <Link href="/create">
                    {isAr ? "ابدأ إنشاء خدمة" : "Start service wizard"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Sale item card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className={isAr ? "text-right" : ""}>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
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
                    ? "اعرض سيارة، عقار، أو أي عنصر آخر للبيع أو للمبادلة."
                    : "List a car, property, or any other item for sale or trade."}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/sales/create">
                    {isAr ? "ابدأ إنشاء إعلان بيع" : "Start sales wizard"}
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

