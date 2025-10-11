"use client";

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getClientLocale, tr } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { listProviderDailyStats } from '@/lib/analytics';
import { listServicesByProvider } from '@/lib/services';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function DashboardPage() {
  const locale = getClientLocale();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [views7d, setViews7d] = useState(0);
  const [msgs7d, setMsgs7d] = useState(0);
  const [ctas7d, setCtas7d] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [pendingDeletionCount, setPendingDeletionCount] = useState(0);
  const [pendingSlotCount, setPendingSlotCount] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        setLoading(true);
        // Services count
        const myServices = await listServicesByProvider(user.uid, 100);
        setServiceCount(myServices.length);
        // 7-day stats
        const stats = await listProviderDailyStats(user.uid, 7);
        setViews7d(stats.reduce((s, r) => s + (Number(r.views || 0)), 0));
        setMsgs7d(stats.reduce((s, r) => s + (Number(r.messages || 0)), 0));
        setCtas7d(stats.reduce((s, r) => s + (Number(r.ctas || 0)), 0));
        // Pending requests owned by this user
        const delQ = query(
          collection(db, 'service_deletion_requests'),
          where('uid', '==', user.uid),
          where('status', '==', 'pending'),
        );
        const delSnap = await getDocs(delQ);
        setPendingDeletionCount(delSnap.docs.length);
        const slotQ = query(
          collection(db, 'service_slot_requests'),
          where('uid', '==', user.uid),
          where('status', '==', 'pending'),
        );
        const slotSnap = await getDocs(slotQ);
        setPendingSlotCount(slotSnap.docs.length);
      } catch {
        // ignore; keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const t = (en: string, ar: string) => (locale === 'ar' ? ar : en);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr(locale, 'dashboard.welcome.title')}</CardTitle>
        <CardDescription>
          {tr(locale, 'dashboard.welcome.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Alerts */}
        {(pendingDeletionCount > 0 || pendingSlotCount > 0) && (
          <div className="mb-4 space-y-2">
            {pendingDeletionCount > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                {t('You have a deletion request pending review.', 'لديك طلب حذف قيد المراجعة.')}
              </div>
            )}
            {pendingSlotCount > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                {t('Your extra slot request is pending review.', 'طلب فتحة خدمة إضافية قيد المراجعة.')}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">{t('My services', 'خدماتي')}</div>
            <div className="text-2xl font-semibold">{loading ? '—' : serviceCount}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">{t('Views (7 days)', 'المشاهدات (7 أيام)')}</div>
            <div className="text-2xl font-semibold">{loading ? '—' : views7d}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">{t('Contacts (7 days)', 'التواصل (7 أيام)')}</div>
            <div className="text-2xl font-semibold">{loading ? '—' : ctas7d}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">{t('Messages (7 days)', 'الرسائل (7 أيام)')}</div>
            <div className="text-2xl font-semibold">{loading ? '—' : msgs7d}</div>
          </div>
        </div>

        {/* Actions */}
        <p className="mb-3">{tr(locale, 'dashboard.welcome.prompt')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/services">{tr(locale, 'dashboard.welcome.goServices')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/services/new">{tr(locale, 'dashboard.welcome.addService')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/services/seed">{t('Open Seed Wizard', 'معالج الإنشاء بالذكاء الاصطناعي')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
