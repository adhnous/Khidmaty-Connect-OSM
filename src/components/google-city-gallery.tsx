"use client";

import React from "react";
import Link from "next/link";
import { CITY_VIEWS } from "@/data/city-views";
import { getClientLocale } from "@/lib/i18n";

export default function GoogleCityGallery() {
  const locale = getClientLocale();

  return (
    <section aria-labelledby="city-gallery-heading">
      <h2 id="city-gallery-heading" className="sr-only">
        City views
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {CITY_VIEWS.map((v, idx) => {
          const hasImage = v.images && v.images.length > 0;
          return (
            <div
              key={`${v.city}-${idx}`}
              className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col"
            >
              {/* 1) Prefer real photo if provided */}
              {hasImage ? (
                v.slug ? (
                  <Link
                    href={`/city-views/${v.slug}`}
                    className="relative block aspect-video w-full bg-muted group"
                    aria-label={`${v.title} - ${v.city}`}
                  >
                    <img
                      src={v.images![0]}
                      alt={`${v.title} - ${v.city}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </Link>
                ) : (
                  <div className="relative aspect-video w-full bg-muted">
                    <img
                      src={v.images![0]}
                      alt={`${v.title} - ${v.city}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )
              ) : /* 2) If no photo yet, show map embed if available */
              v.embedUrl ? (
                <div className="aspect-video w-full bg-muted">
                  <iframe
                    src={v.embedUrl}
                    title={`${v.title} - ${v.city}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* 3) Fallback: simple link to Google Maps */
                <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  {v.linkUrl ? (
                    <a
                      href={v.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {locale === "ar"
                        ? "عرض على خرائط Google"
                        : "View on Google Maps"}
                    </a>
                  ) : (
                    <span>
                      {locale === "ar" ? "لا يوجد عرض" : "No view available"}
                    </span>
                  )}
                </div>
              )}

              {/* Text */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className="font-semibold text-base sm:text-lg truncate"
                    title={v.title}
                  >
                    {v.title}
                  </h3>
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5 whitespace-nowrap">
                    {v.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{v.city}</p>

                {v.slug && hasImage && (
                  <div className="mt-2">
                    <Link
                      href={`/city-views/${v.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {locale === "ar" ? "عرض الصور" : "See photos"}
                    </Link>
                  </div>
                )}

                {!hasImage && !v.embedUrl && v.linkUrl && (
                  <div className="mt-3">
                    <a
                      href={v.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      {locale === "ar"
                        ? "عرض على خرائط Google"
                        : "View on Google Maps"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-center text-muted-foreground">
        يتم عرض الخرائط من خلال Google Maps، وجميع الحقوق محفوظة لـ Google ولأصحاب المحتوى الأصليين.
        <br />
        Map previews are loaded from Google Maps. All rights remain with Google and original contributors.
      </p>
    </section>
  );
}
