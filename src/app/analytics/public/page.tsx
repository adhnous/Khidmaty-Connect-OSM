// src/app/analytics/public/page.tsx
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Public Analytics',
  description: 'Public dashboard embed',
};

export const dynamic = 'force-static';

export default function PublicDashboardPage() {
  const url = process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_URL || '';
  const locale = (cookies().get('locale')?.value || 'ar').toLowerCase();
  const isAr = locale.startsWith('ar');

  if (!url) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold">
          {isAr ? 'لوحة عامة غير مهيأة' : 'Public dashboard is not configured'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAr
            ? 'ضع NEXT_PUBLIC_PUBLIC_DASHBOARD_URL في ملف البيئة إلى رابط تضمين عام من Looker Studio أو Grafana.'
            : 'Set NEXT_PUBLIC_PUBLIC_DASHBOARD_URL in your env to a public Looker Studio or Grafana embed URL.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-6">
      <h1 className="sr-only">{isAr ? 'تحليلات عامة' : 'Public Analytics'}</h1>
      <div className="w-full aspect-[16/10] rounded-lg border overflow-hidden">
        <iframe
          src={url}
          className="h-full w-full"
          loading="lazy"
          allow="fullscreen"
          // Keeps it safe & compatible with Looker Studio
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
