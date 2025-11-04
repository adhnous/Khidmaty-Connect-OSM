import type { Metadata } from 'next';
import './globals.css';
import '@/styles/design-system.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { cookies } from 'next/headers';
import SwRegister from '@/components/sw-register';
import AdStrip from '@/components/ad-strip';
import TopNav from '@/components/layout/top-nav';
import AppGate from '@/components/app-gate';
import MainShell from '@/components/main-shell';
import BottomNavGate from '@/components/layout/bottom-nav-gate';
import PwaInstall from '@/components/pwa-install';
import { Footer } from '@/components/layout/footer';
import { PT_Sans, Tajawal, Cairo } from 'next/font/google';

// Cairo (default app font)
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300','400','600','700'],
  display: 'swap',
  variable: '--font-cairo',
});

// Optional: keep these variables in case you use them for specific components
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'خدمتي كونكت',
  description: 'وسيلتك للتواصل مع المهنيين المحترفين في ليبيا',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Always use Arabic as the default language
  const locale = 'ar';
  const dir = 'rtl';

  return (
    <html lang={locale} dir={dir} className={cairo.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body className={`${cairo.variable} ${ptSans.variable} ${tajawal.variable} font-body antialiased bg-background text-foreground`}>
        <a href="#content" className="skip-link">{dir === 'rtl' ? 'تخطي إلى المحتوى' : 'Skip to content'}</a>
        <AuthProvider>
          <AdStrip />
          <TopNav />
          <AppGate>
            {/* reserve space via CSS tokens: ads + nav */}
            <main data-app className="min-h-screen" style={{ paddingTop: 'calc(var(--ad-height, 32px) + var(--navH, 56px))' }}>
              {children}
            </main>
            <Footer />
            <PwaInstall />
            <BottomNavGate />
          </AppGate>
          <Toaster />
          <SwRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
