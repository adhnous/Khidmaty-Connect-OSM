"use client";

import { ServiceForm } from '@/components/service-form';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientLocale, tr } from '@/lib/i18n';

export default function NewServicePage() {
  const locale = getClientLocale();
  const { user } = useAuth();
  useEffect(() => {}, [user?.uid]);

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
            <Button variant="secondary" asChild>
              <Link href="/dashboard/services/quick">{locale === 'ar' ? 'إنشاء سريع (خطوتان)' : 'Quick Create (2 steps)'}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/services/seed">{locale === 'ar' ? 'جرّب معالج الإنشاء بالذكاء الاصطناعي' : 'Try the AI Seed Wizard'}</Link>
            </Button>
          </div>
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
