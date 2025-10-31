"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientLocale, tr } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

export default function NewServicePage() {
  const locale = getClientLocale();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new 3-step wizard
    router.replace('/create');
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{tr(locale, 'dashboard.serviceForm.newTitle')}</CardTitle>
          <CardDescription>
            {tr(locale, 'dashboard.serviceForm.newSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/create">{locale === 'ar' ? 'ابدأ المعالج الجديد (٣ خطوات)' : 'Start New Wizard (3 steps)'}</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/services/quick">{locale === 'ar' ? 'إنشاء سريع (خطوتان)' : 'Quick Create (2 steps)'}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/services/seed">{locale === 'ar' ? 'جرب معالج النماذج بالذكاء الاصطناعي' : 'Try the AI Seed Wizard'}</Link>
            </Button>
          </div>
          {/* Legacy ServiceForm intentionally removed in favor of the wizard */}
        </CardContent>
      </Card>
    </div>
  );
}

