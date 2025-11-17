'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/service-card';
import { listServicesFiltered, type Service } from '@/lib/services';
import { libyanCities } from '@/lib/cities';
import { getClientLocale, tr } from '@/lib/i18n';
import {
  CategoryCards,
  type CategoryCardId,
} from '@/components/category-cards';
import CityPicker from '@/components/city-picker';

const ALL_CITIES = 'ALL_CITIES';

export default function ServicesBrowsePage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [city, setCity] = useState<string>(ALL_CITIES);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryCardId | null>(
    null,
  );
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
          : isAr
          ? '+¡+»+½ +«+++ú +ú+½+å+º+í +¬+¡+à+è+ä +º+ä+«+»+à+º+¬.'
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

    // Simple keyword from id for now
    const defLabel = id;
    setQ(defLabel);

    // On mobile, scroll results into view after choosing a category
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const el = resultsRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    } catch {
      // ignore
    }
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
                      onFocus={() => setShowCategoryPopup(true)}
                      placeholder={
                        (tr(locale, 'home.searchPlaceholder') as string) ||
                        (isAr
                          ? '+à+º +º+ä+Ñ+¦+ä+º+å +º+ä+¦+è +¬+¿+¡+½ +¦+å+ç+ƒ'
                          : 'What are you looking for?')
                      }
                      className="h-11"
                      dir={isAr ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* city select */}
                  <div className="w-full md:w-56">
                    <CityPicker
                      locale={isAr ? 'ar' : 'en'}
                      value={city}
                      onChange={(val) => setCity(val)}
                      options={libyanCities}
                      placeholder={
                        (tr(locale, 'home.cityPlaceholder') as string) ||
                        (isAr ? '+º+¿+¡+½ +¦+å +à+»+è+å+¬' : 'Search city')
                      }
                      className="h-11"
                      allOption={{
                        value: ALL_CITIES,
                        label: isAr ? '+â+ä +º+ä+à+»+å' : 'All cities',
                      }}
                    />
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
                      {isAr ? '+Ñ+¦+º+»+¬ +¬+¦+è+è+å +º+ä+ü+ä+º+¬+¦' : 'Reset filters'}
                    </Button>
                    <Button
                      className="h-11 bg-power text-white hover:bg-powerDark"
                      onClick={() => void fetchServices()}
                    >
                      {tr(locale, 'home.search') || (isAr ? '+¿+¡+½' : 'Search')}
                    </Button>
                  </div>
                </div>

                {/* popup category panel triggered by search focus */}
                {showCategoryPopup && (
                  <div className="mt-3 rounded-2xl border bg-card p-3 shadow-lg">
                    <div
                      className={`mb-2 flex items-center justify-between text-xs font-semibold ${
                        isAr ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>
                        {isAr ? '+º+«+¬+¦ +å+ê+¦ +º+ä+«+»+à+¬' : 'Choose service type'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCategoryPopup(false)}
                        className="px-2 text-muted-foreground"
                      >
                        +ù
                      </button>
                    </div>
                    <CategoryCards
                      locale={isAr ? 'ar' : 'en'}
                      selectedId={activeCategory}
                      onSelect={(id) => {
                        handleCategorySelect(id);
                        setShowCategoryPopup(false);
                      }}
                      size="sm"
                      tone="solid"
                      hideSales
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section
          ref={resultsRef}
          className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pt-8"
        >
          <div
            className={`mb-4 flex items-center justify-between ${
              isAr ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <h2 className="text-xl font-bold md:text-2xl">
              {isAr ? '+«+»+à+º+¬ +¦+º+ª+¦+¬' : 'Popular services'}
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
              {isAr ? '+ä+º +¬+ê+¼+» +«+»+à+º+¬ +¿+¦+».' : 'No services yet.'}
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
                      : 'https://placehold.co/800x600.png?text=Service'
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
