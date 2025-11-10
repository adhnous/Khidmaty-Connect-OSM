import React from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import GoogleCityGallery from "@/components/google-city-gallery";
import { getFeatures } from "@/lib/settings";

export default async function CityViewsPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value || "ar";
  const locale = localeCookie.toLowerCase().startsWith("ar") ? "ar" : "en";

  const features = await getFeatures();
  if (features?.showCityViews === false) return notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {locale === "ar" ? "معرض مشاهد المدن" : "City Views Gallery"}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {locale === "ar"
            ? "هذا القسم ينظّم مشاهد المدن والمواقع باستخدام تضمينات وروابط عامة من خرائط Google (بدون واجهات مدفوعة)."
            : "This page organizes city/location views using public Google Maps embeds and links (no paid APIs)."}
        </p>
      </div>

      <GoogleCityGallery />

      <p className="mt-8 text-xs text-muted-foreground">
        Views are loaded from Google Maps. All rights remain with Google and original contributors.
        <br />
        يتم عرض المشاهد من خلال Google Maps، وجميع الحقوق محفوظة لـ Google ولأصحاب الصور الأصليين.
      </p>
    </main>
  );
}
