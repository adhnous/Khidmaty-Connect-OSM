'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ServiceCard } from '@/components/service-card';
import { listServicesFiltered, type Service } from '@/lib/services';
import { libyanCities } from '@/lib/cities';
import { getClientLocale, tr } from '@/lib/i18n';
import {
  CategoryCards,
  type CategoryCardId,
} from '@/components/category-cards';

const ALL_CITIES = 'ALL_CITIES';

export default function ServicesBrowsePage() {
  const locale = getClientLocale();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState<string>(ALL_CITIES);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryCardId | null>(
    null,
  );

  async function fetchServices() {
    setLoading(true);
    setError(null);
    try {
      const base = await listServicesFiltered({
        city: city === ALL_CITIES ? undefined : city,
        limit: 80,
      });

      const needle = q.trim().toLowerCase();
      let rows = base;

      if (needle) {
        rows = rows.filter((s: any) => {
          const title = String(s?.title || '').toLowerCase();
          const desc = String(s?.description || '').toLowerCase();
          const cat = String(s?.category || '').toLowerCase();
          const cityText = String(s?.city || '').toLowerCase();
          const areaText = String(s?.area || '').toLowerCase();
          return (
            title.includes(needle) ||
            desc.includes(needle) ||
            cat.includes(needle) ||
            cityText.includes(needle) ||
            areaText.includes(needle)
          );
        });
      }

      setServices(rows);
    } catch (e: any) {
      setServices([]);
      setError(
        typeof e?.message === 'string'
          ? e.message
          : locale === 'ar'
          ? 'حدث خطأ أثناء تحميل الخدمات.'
          : 'Failed to load services.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCategorySelect(id: CategoryCardId) {
    if (activeCategory === id) {
      setActiveCategory(null);
      return;
    }
    setActiveCategory(id);
    // use the localized label as a quick search term
    const defLabel =
      locale === 'ar'
        ? // Arabic labels live in CATEGORY_DEFS; rely on CategoryCards behaviour by
          // setting q to the current visible label via a simple mapping.
          // For now we just reuse the id as a keyword for filtering.
          id
        : id;
    setQ(defLabel);
  }

  useEffect(() => {
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Debounced search by text/category
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchServices();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, activeCategory]);

  const isAr = locale === 'ar';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Hero search + categories */}
        <section className="bg-gradient-to-b from-[#c96a00] via-[#c96a00] to-background pb-8 pt-4 md:pb-10 md:pt-6">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-2xl bg-background shadow-xl">
              <div className="border-b px-4 pb-4 pt-4 md:px-6 md:pt-6">
                <div
                  className={`flex flex-col gap-3 md:flex-row md:items-center ${
                    isAr ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* search input */}
                  <div className="flex-1">
                    <Input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={
                        (tr(
                          locale,
                          'home.searchPlaceholder',
                        ) as string) ||
                        (isAr
                          ? 'ما الإعلان الذي تبحث عنه؟'
                          : 'What are you looking for?')
                      }
                      className="h-11"
                    />
                  </div>

                  {/* city select */}
                  <div className="w-full md:w-56">
                    <Select
                      value={city}
                      onValueChange={(value) => setCity(value)}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue
                          placeholder={
                            tr(locale, 'home.cityPlaceholder') as string
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_CITIES}>
                          {isAr ? 'كل المدن' : 'All cities'}
                        </SelectItem>
                        {libyanCities.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* buttons */}
                  <div
                    className={`flex gap-2 ${
                      isAr ? 'justify-start md:justify-start' : ''
                    }`}
                  >
                    <Button
                      variant="outline"
                      className="h-11 px-4"
                      onClick={() => {
                        setCity(ALL_CITIES);
                        setQ('');
                        setActiveCategory(null);
                      }}
                    >
                      {isAr ? 'إعادة تعيين الفلاتر' : 'Reset filters'}
                    </Button>
                    <Button
                      className="h-11 bg-power text-white hover:bg-powerDark"
                      onClick={() => void fetchServices()}
                    >
                      {tr(locale, 'home.search') || (isAr ? 'بحث' : 'Search')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* category cards */}
              <div className="px-4 pb-4 pt-3 md:px-6 md:pb-6">
                <div
                  className={`mb-3 text-xs font-semibold text-muted-foreground ${
                    isAr ? 'text-right' : ''
                  }`}
                >
                  {isAr ? 'اختر نوع الخدمة' : 'Browse by service type'}
                </div>
                <CategoryCards
                  locale={isAr ? 'ar' : 'en'}
                  selectedId={activeCategory}
                  onSelect={handleCategorySelect}
                  size="sm"
                  tone="solid"
                  hideSales
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pt-8">
          <div
            className={`mb-4 flex items-center justify-between ${
              isAr ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <h2 className="text-xl font-bold md:text-2xl">
              {isAr ? 'خدمات شائعة' : 'Popular services'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border bg-muted"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {isAr ? 'لا توجد خدمات بعد.' : 'No services yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  category={s.category}
                  city={s.city}
                  price={s.price}
                  priceMode={s.priceMode}
                  imageUrl={
                    Array.isArray((s as any).images) &&
                    (s as any).images[0]?.url
                      ? (s as any).images[0].url
                      : 'https://placehold.co/800x600?text=Service'
                  }
                  aiHint={`category:${s.category}; city:${s.city}`}
                  href={`/services/${s.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

