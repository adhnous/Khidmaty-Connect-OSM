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

const mockServices = [
  {
    id: '1',
    title: 'Professional Plumbing Repairs & Installation',
    category: 'Plumbing',
    city: 'Tripoli',
    price: 150,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'plumbing repair',
  },
  {
    id: '2',
    title: 'Full House Cleaning Service',
    category: 'Home Services',
    city: 'Benghazi',
    price: 250,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'house cleaning',
  },
  {
    id: '3',
    title: 'Expert Car Mechanic for All Brands',
    category: 'Automotive',
    city: 'Misrata',
    price: 200,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'car mechanic',
  },
  {
    id: '4',
    title: 'Private Math & Science Tutoring',
    category: 'Education',
    city: 'Tripoli',
    price: 100,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'tutoring session',
  },
  {
    id: '5',
    title: 'Electrical Wiring and Fixture Installation',
    category: 'Electrical',
    city: 'Benghazi',
    price: 180,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'electrical work',
  },
  {
    id: '6',
    title: 'Custom Wood Furniture and Carpentry',
    category: 'Carpentry',
    city: 'Tripoli',
    price: 500,
    imageUrl: 'https://placehold.co/400x300.png',
    aiHint: 'carpentry wood',
  },
];

const mockCategories = [
  { name: 'Plumbing', icon: Wrench },
  { name: 'Home Services', icon: HomeIcon },
  { name: 'Automotive', icon: Car },
  { name: 'Education', icon: Briefcase },
  { name: 'Electrical', icon: Hammer },
];
const mockCities = ['All Cities', 'Tripoli', 'Benghazi', 'Misrata'];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState<string>('All Cities');
  const [category, setCategory] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
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
  }, [city, category, maxPrice]);

  async function fetchServices() {
    try {
      setLoading(true);
      const filters: ListFilters = {};
      if (category) filters.category = category;
      if (city && city !== 'All Cities') filters.city = city;
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      const data = await listServicesFiltered({ ...filters, limit: 24 });
      const needle = q.trim().toLowerCase();
      const filtered = needle
        ? data.filter((s) =>
            (s.title || '').toLowerCase().includes(needle) ||
            (s.category || '').toLowerCase().includes(needle) ||
            (s.city || '').toLowerCase().includes(needle)
          )
        : data;
      setServices(filtered);
    } catch (e) {
      console.warn('Failed to load services, showing demo cards.', e);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  const cards = (services.length ? services : null) ?? [];

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
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-2 rounded-lg bg-background p-4 shadow-lg md:grid-cols-5">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder={tr(locale, 'home.searchPlaceholder')}
                    className="h-12 text-base"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={tr(locale, 'home.cityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'All Cities' ? tr(locale, 'home.allCities') : c}
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {mockCategories.map((categoryItem) => (
                <Button
                  key={categoryItem.name}
                  variant="outline"
                  className="h-28 flex-col gap-2 rounded-lg border-2 text-lg hover:border-primary hover:bg-primary/10"
                  onClick={() => {
                    setCategory(categoryItem.name);
                    // Trigger refetch immediately
                    setTimeout(() => fetchServices(), 0);
                  }}
                >
                  <categoryItem.icon className="h-8 w-8 text-primary" />
                  <span>{tr(locale, `categories.${categoryItem.name}`)}</span>
                </Button>
              ))}
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(cards.length
                ? cards.map((s) => ({
                    id: s.id!,
                    title: s.title,
                    category: s.category,
                    city: s.city,
                    price: s.price,
                    imageUrl:
                      s.images?.[0]?.url || 'https://placehold.co/400x300.png',
                    aiHint: s.category,
                    href: `/services/${s.id}`,
                  }))
                : mockServices.map((m) => ({
                    ...m,
                    href: `/services/demo-${m.id}`,
                  }))
              ).map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
