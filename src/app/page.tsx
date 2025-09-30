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
  Wrench,
} from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ServiceCard } from '@/components/service-card';
import { useEffect, useState } from 'react';
import { listServicesFiltered, type Service, type ListFilters } from '@/lib/services';
import { getClientLocale, tr } from '@/lib/i18n';
import { libyanCities, cityLabel } from '@/lib/cities';


const mockCategories = [
  { name: 'Plumbing', icon: Wrench },
  { name: 'Home Services', icon: HomeIcon },
  { name: 'Automotive', icon: Car },
  { name: 'Education', icon: Briefcase },
  { name: 'Electrical', icon: Hammer },
];
const cityOptions = ['All Cities', ...libyanCities.map((c) => c.value)];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState<string>('All Cities');
  const [category, setCategory] = useState<string>('All Categories');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');
  const locale = getClientLocale();

  useEffect(() => {
    // Initial load
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-refetch on filter changes except text query (which requires pressing Search)
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category, maxPrice, sort]);

  async function fetchServices() {
    try {
      setLoading(true);
      const filters: ListFilters = {};
      if (category && category !== 'All Categories') filters.category = category;
      if (city && city !== 'All Cities') filters.city = city;
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      const data = await listServicesFiltered({ ...filters, limit: 24 });
      const needle = q.trim().toLowerCase();
      let filtered = needle
        ? data.filter((s) =>
            (s.title || '').toLowerCase().includes(needle) ||
            (s.category || '').toLowerCase().includes(needle) ||
            (s.city || '').toLowerCase().includes(needle)
          )
        : data;
      // Apply client-side sort for price; for newest, keep backend default
      if (sort === 'priceLow') {
        filtered = [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      } else if (sort === 'priceHigh') {
        filtered = [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-secondary py-16 md:py-24">
          <div className="container text-center">
            <h1 className="text-4xl font-bold font-headline md:text-5xl">
              {tr(locale, 'home.heroTitle')}
            </h1>
            <p className="mb-8 mt-4 text-lg text-muted-foreground">
              {tr(locale, 'home.heroSubtitle')}
            </p>
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 gap-2 rounded-lg bg-background p-4 shadow-lg md:grid-cols-7">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder={tr(locale, 'home.searchPlaceholder')}
                    className="h-12 text-base"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={tr(locale, 'home.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {[tr(locale, 'home.allCategories'), ...mockCategories.map((c) => c.name)].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === tr(locale, 'home.allCategories') ? tr(locale, 'home.allCategories') : tr(locale, `categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={tr(locale, 'home.cityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'All Cities' ? tr(locale, 'home.allCities') : cityLabel(locale, c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder={tr(locale, 'home.maxPricePlaceholder')}
                  className="h-12 text-base"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={tr(locale, 'home.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{tr(locale, 'home.sortNewest')}</SelectItem>
                    <SelectItem value="priceLow">{tr(locale, 'home.sortPriceLow')}</SelectItem>
                    <SelectItem value="priceHigh">{tr(locale, 'home.sortPriceHigh')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="lg" className="h-12 text-base" onClick={fetchServices}>
                  <Search className="mr-2" />
                  {tr(locale, 'home.search')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <h2 className="mb-8 text-center text-3xl font-bold font-headline">
              {tr(locale, 'home.featuredCategories')}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {mockCategories.map((categoryItem) => {
                const selected = category === categoryItem.name;
                return (
                  <Button
                    key={categoryItem.name}
                    variant="ghost"
                    aria-label={tr(locale, `categories.${categoryItem.name}`)}
                    aria-pressed={selected}
                    className={`group relative h-28 w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-secondary/70 p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      selected
                        ? 'ring-2 ring-primary/60 border-primary/40'
                        : 'border-border/60 hover:border-primary/30'
                    }`}
                    onClick={() => {
                      setCategory(categoryItem.name);
                      setTimeout(() => fetchServices(), 0);
                    }}
                  >
                    <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-200 ${
                      selected ? 'bg-primary/20 opacity-100' : 'bg-primary/10 group-hover:opacity-100'
                    }`} />
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-5">
                      <div className={`rounded-full p-4 ring-1 transition-colors duration-200 ${
                        selected ? 'bg-primary/20 ring-primary/40' : 'bg-primary/10 ring-primary/20 group-hover:bg-primary/15'
                      }`}>
                        <categoryItem.icon className="h-10 w-10 text-primary" />
                      </div>
                      <span className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-foreground/90'}`}>
                        {tr(locale, `categories.${categoryItem.name}`)}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-16">
          <div className="container">
            <h2 className="mb-8 text-3xl font-bold font-headline">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
      <Footer />
    </div>
  );
}
