"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Car,
  Hammer,
  Home as HomeIcon,
  Search,
  Megaphone,
  ShoppingCart,
} from 'lucide-react';
import { ServiceCard } from '@/components/service-card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listServicesFiltered, type Service, type ListFilters } from '@/lib/services';
import { getClientLocale, tr } from '@/lib/i18n';
import { libyanCities, cityLabel } from '@/lib/cities';
import { CategoryCards, type CategoryCardId, CATEGORY_DEFS } from '@/components/category-cards';


const featuredCategories = [
  { name: 'education', icon: Briefcase },
  { name: 'homeServices', icon: HomeIcon },
  { name: 'automotive', icon: Car },
  { name: 'electrical', icon: Hammer },
  { name: 'digitalMarketing', icon: Megaphone },
  { name: 'sales', icon: ShoppingCart },
];
// Stable sentinel values so labels can be localized while values remain constant
const ALL_CATEGORIES = 'ALL_CATEGORIES';
const ALL_CITIES = 'ALL_CITIES';
const cityOptions = [ALL_CITIES, ...libyanCities.map((c) => c.value)];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState<string>(ALL_CITIES);
  const [category, setCategory] = useState<string | CategoryCardId>(ALL_CATEGORIES as string);
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');
  const [searchFocused, setSearchFocused] = useState(false);
  const locale = getClientLocale();

  useEffect(() => {
    // Initial load
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-refetch on filter changes
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category, maxPrice, sort]);

  // Debounced search when typing
  useEffect(() => {
    const t = setTimeout(() => void fetchServices(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function fetchServices() {
    try {
      setLoading(true);
      const isGroup = category && category !== ALL_CATEGORIES;
      const baseFilters: ListFilters = {};
      if (city && city !== ALL_CITIES) baseFilters.city = city;
      if (maxPrice) baseFilters.maxPrice = Number(maxPrice);
      const needle = q.trim().toLowerCase();
      const take = needle ? 300 : (isGroup ? 120 : 24);
      const data = await listServicesFiltered({ ...baseFilters, limit: take });
      

      const belongsToGroup = (raw: string, g: string): boolean => {
        const s = String(raw || '').toLowerCase();
        const has = (...ks: string[]) => ks.some(k => s.includes(k));
        switch (g) {
          case 'repair': return has('repair','plumb','electric','carpentr','home','clean','paint','hvac','air condi','appliance','roof','floor','til','handyman','furniture','metal','weld','masonry','concrete','glass','aluminum','interior');
          case 'consulting': return has('consult','legal','account','tax','insur','real estate','architect','engineer','market research','support');
          case 'education': return has('educat','tutor','training','teach');
          case 'hr': return has('hr','recruit','employment','hiring','human resources');
          case 'medical': return has('health','medical','clinic','care','nurse','elderly','child');
          case 'transport': return has('transport','delivery','car wash','car repair','mechanic','truck','motorcycle','boat','marine','vehicle');
          case 'creative': return has('advertis','creative','graphic','design','photo','video','print','branding','copywrit','packaging','label');
          case 'sales': return has('sales','retail','store','shop','e-commerce','marketplace','pos','merchandising','signage','inventory');
          case 'crafts': return has('craft','tailor','locksmith','weld','carpentr','handmade','artisan','agricult');
          default: return false;
        }
      };

      let filtered = data;

      if (isGroup) {
        filtered = data.filter(s => String((s.category || '')).toLowerCase() === String(category).toLowerCase() || belongsToGroup(s.category, String(category)));
      }

      if (needle) {
        const catLabelIds = Object.entries(CATEGORY_DEFS)
          .filter(([_, def]) => def.ar.toLowerCase().includes(needle) || def.en.toLowerCase().includes(needle))
          .map(([id]) => id as CategoryCardId);
        const matchCategoryLabels = (s: Service) => catLabelIds.some((id) => belongsToGroup(s.category, String(id)));
        filtered = filtered.filter((s) =>
          (s.title || '').toLowerCase().includes(needle) ||
          (s.description || '').toLowerCase().includes(needle) ||
          (s.category || '').toLowerCase().includes(needle) ||
          (s.city || '').toLowerCase().includes(needle) ||
          matchCategoryLabels(s)
        );
      }

      if (sort === 'priceLow') {
        filtered = [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      } else if (sort === 'priceHigh') {
        filtered = [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      }

      {
        const isBoosted = (s: Service) => (((s as any)?.priority ?? 0) > 0) || ((s as any)?.featured === true);
        if (filtered.some((s) => isBoosted(s))) {
          const boosted = filtered.filter(isBoosted);
          const normal = filtered.filter((s) => !isBoosted(s));
          filtered = [...boosted, ...normal];
        }
      }
      setServices(filtered);
    } catch (e) {
      console.warn('Failed to load services, showing empty state.', e);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <main className="flex-1">
        <section className="relative bg-gradient-to-b from-ink via-copperDark to-copper text-snow overflow-hidden py-12 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 relative text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight font-headline">
              {tr(locale, 'home.heroTitle')}
            </h1>
            <p className="mt-3 text-base md:text-lg text-snow/80">
              {tr(locale, 'home.heroSubtitle')}
            </p>
            <div className="mt-6 mb-5 flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <Link href="/dashboard/services">
                <Button size="sm" className="h-9 md:h-10 font-semibold bg-white/90 text-ink hover:bg-white border border-white/30 shadow-sm">
                  <Briefcase className="me-2 h-4 w-4" />
                  {tr(locale, 'home.providerCta')}
                </Button>
              </Link>
              <Link href="#search">
                <Button size="sm" className="h-9 md:h-10 bg-power hover:bg-powerDark text-snow font-semibold">
                  <Search className="me-2 h-4 w-4" />
                  {tr(locale, 'home.seekerCta')}
                </Button>
              </Link>
            </div>
            <div id="search" className="mx-auto max-w-6xl mt-6 scroll-mt-[calc(var(--ad-height, 32px)+var(--navH))]">
              <div className="rounded-2xl copper-gradient p-[2px]">
                <div className="rounded-[1rem] bg-background text-foreground p-3 md:p-4 shadow-lg">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
                  <div className="md:col-span-3">
                    <Input
                      type="text"
                      inputMode="search"
                      autoComplete="off"
                      placeholder={tr(locale, 'home.searchPlaceholder')}
                      className="h-11 text-sm md:text-base text-foreground placeholder:text-muted-foreground"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void fetchServices(); } }}
                    />
                  </div>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-11 text-sm md:text-base text-foreground">
                      <SelectValue className="text-foreground" placeholder={tr(locale, 'home.cityPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CITIES}>{tr(locale, 'home.allCities')}</SelectItem>
                      {libyanCities.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {cityLabel(locale, c.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder={tr(locale, 'home.maxPricePlaceholder')}
                    className="h-11 text-sm md:text-base text-foreground placeholder:text-muted-foreground"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                  <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                    <SelectTrigger className="h-11 text-sm md:text-base text-foreground">
                      <SelectValue className="text-foreground" placeholder={tr(locale, 'home.sortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{tr(locale, 'home.sortNewest')}</SelectItem>
                      <SelectItem value="priceLow">{tr(locale, 'home.sortPriceLow')}</SelectItem>
                      <SelectItem value="priceHigh">{tr(locale, 'home.sortPriceHigh')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="lg" className="h-11 md:h-12 w-full text-base bg-power hover:bg-powerDark text-white" onClick={fetchServices}>
                    <Search className="mr-2" />
                    {tr(locale, 'home.search')}
                  </Button>
                </div>
                {!(searchFocused || q.trim().length > 0) && (
                  <div className="mt-4 border-t pt-4">
                    <CategoryCards
                      locale={locale}
                      selectedId={category === ALL_CATEGORIES ? null : (category as any)}
                      onSelect={(id) => setCategory(id)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </section>

        

        <section className="bg-secondary py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-8 text-2xl md:text-3xl font-bold font-headline">
              {tr(locale, 'home.popularServices')}
            </h2>
            {loading && (
              <p className="mb-6 text-muted-foreground">{tr(locale, 'home.loading')}</p>
            )}
            {services.length === 0 && (
              <div className="mb-6 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                <p className="mb-2">{tr(locale, 'home.empty1')}</p>
                <p>{tr(locale, 'home.empty2')}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  category={s.category}
                  city={s.city}
                  price={s.price}
                  imageUrl={s.images?.[0]?.url || 'https://placehold.co/400x300.png'}
                  aiHint={s.category}
                  href={`/services/${s.id}`}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
