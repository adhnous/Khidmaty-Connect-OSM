"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { listProviderSaleItems, type SaleItem } from '@/lib/sale-items';
import { listServicesByProvider, type Service } from '@/lib/services';
import SaleCard from '@/components/SaleCard';
import { ServiceCard } from '@/components/service-card';
import { getClientLocale, tr } from '@/lib/i18n';

export default function ProviderShopPage() {
  const params = useParams<{ providerId: string }>();
  const providerId = Array.isArray(params?.providerId) ? params.providerId[0] : params?.providerId;
  const [tab, setTab] = useState<'sales' | 'services'>('sales');
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = getClientLocale();

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    (async () => {
      try {
        const [si, sv] = await Promise.all([
         // listProviderSaleItems(providerId, { status: 'active' }),
            listProviderSaleItems(providerId, { status: 'approved' }),
          listServicesByProvider(providerId, 50),
        ]);
        setSales(si);
        setServices(sv);
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  if (!providerId) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">{locale==='ar' ? 'المتجر' : 'Shop'}</h1>
      <Tabs value={tab} onValueChange={(v)=>setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="sales">{locale==='ar'?'البيع':'Sales'}</TabsTrigger>
          <TabsTrigger value="services">{tr(locale,'home.popularServices')}</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          {loading ? (
            <p className="text-muted-foreground">{tr(locale,'home.loading')}</p>
          ) : sales.length === 0 ? (
            <div className="rounded-md border p-4 text-muted-foreground">{locale==='ar'?'لا توجد عناصر':'No items yet.'}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {sales.map((it) => <SaleCard key={it.id} item={it} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="services">
          {loading ? (
            <p className="text-muted-foreground">{tr(locale,'home.loading')}</p>
          ) : services.length === 0 ? (
            <div className="rounded-md border p-4 text-muted-foreground">{locale==='ar'?'لا توجد خدمات':'No services yet.'}</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  category={s.category}
                  city={s.city}
                  price={s.price}
                  priceMode={(s as any).priceMode}
                  imageUrl={(s as any)?.images?.[0]?.url || 'https://placehold.co/400x300.png'}
                  aiHint={s.category}
                  href={`/services/${s.id}`}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
