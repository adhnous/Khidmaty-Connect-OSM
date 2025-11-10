import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CITY_VIEWS } from "@/data/city-views";

export default async function CityPhotosPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug;
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value || "ar";
  const locale = localeCookie.toLowerCase().startsWith("ar") ? "ar" : "en";

  const item = CITY_VIEWS.find((c) => c.slug === slug);
  if (!item) return notFound();

  const title = locale === "ar" ? `مشاهد ${item.city}` : `${item.city} Views`;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {locale === "ar"
            ? "يتم عرض المشاهد باستخدام تضمين أو رابط عام من خرائط Google فقط (بدون واجهات مدفوعة)."
            : "Views are shown using public Google Maps embeds or links only (no paid APIs)."}
        </p>
      </div>

      {item.images?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {item.images.map((src, idx) => (
            <a
              key={`${item.slug}-img-${idx}`}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block bg-muted aspect-square overflow-hidden group"
            >
              <img
                src={src}
                alt={`${item.city} ${locale === "ar" ? "صورة" : "photo"} #${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : item.embedUrl ? (
        <div className="w-full max-w-5xl mx-auto">
          <div className="aspect-video w-full bg-muted">
            <iframe
              src={item.embedUrl}
              title={`${item.title} - ${item.city}`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      ) : item.linkUrl ? (
        <div className="text-center">
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:underline"
          >
            {locale === "ar" ? "فتح في خرائط Google" : "Open in Google Maps"}
          </a>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {locale === "ar" ? "لا يوجد عرض متاح." : "No view available."}
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        {locale === 'ar'
          ? 'يتم عرض المشاهد من خلال Google Maps، وجميع الحقوق محفوظة لـ Google ولأصحاب الصور الأصليين.'
          : 'Views are loaded from Google Maps. All rights remain with Google and original contributors.'}
      </p>
    </main>
  );
}
