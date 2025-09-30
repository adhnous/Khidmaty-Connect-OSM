"use client";
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

export default function DashboardPage() {
  const locale = getClientLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr(locale, 'dashboard.welcome.title')}</CardTitle>
        <CardDescription>
          {tr(locale, 'dashboard.welcome.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{tr(locale, 'dashboard.welcome.prompt')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/services">{tr(locale, 'dashboard.welcome.goServices')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/services/new">{tr(locale, 'dashboard.welcome.addService')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
