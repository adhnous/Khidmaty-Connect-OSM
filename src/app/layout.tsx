import type {Metadata} from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { cookies } from 'next/headers';
import SwRegister from '@/components/sw-register';
import AdStrip from '@/components/ad-strip';
import AppGate from '@/components/app-gate';
import BottomNav from '@/components/layout/bottom-nav';
import PwaInstall from '@/components/pwa-install';

export const metadata: Metadata = {
  title: 'Khidmaty Connect',
  description: 'Your connection to skilled professionals in Libya.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en').toLowerCase();
  const dir = locale.startsWith('ar') ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>

      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <AdStrip />
          <AppGate>
            {/* reserve space for fixed BottomNav + iOS safe area */}
            <main className="min-h-[100svh] pt-2 pb-24 pb-safe">
              {children}
            </main>
            <PwaInstall />
            <BottomNav />
          </AppGate>
          <Toaster />
          <SwRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
