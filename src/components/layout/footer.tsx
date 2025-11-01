"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tr } from '@/lib/i18n';
import { Shield, Handshake } from 'lucide-react';

export function Footer() {
  const [locale, setLocale] = useState<'en' | 'ar'>(() => {
    try {
      const fromHtml = (typeof document !== 'undefined' ? (document.documentElement.getAttribute('lang') || 'en') : 'en').toLowerCase();
      return fromHtml.startsWith('ar') ? 'ar' : 'en';
    } catch { return 'en'; }
  });
  useEffect(() => {
    try {
      const fromHtml = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      setLocale(fromHtml.startsWith('ar') ? 'ar' : 'en');
    } catch {}
  }, []);
  return (
    <footer className="border-t border-white/10 bg-black text-white pb-safe">
      <div className="container py-6 md:py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:gap-8 md:flex-row">
          <Link href="/" className="flex items-center gap-2" aria-label={locale === 'ar' ? 'خدمتي' : 'Khidmaty'}>
            <span className="relative h-8 w-8 text-orange-400" aria-hidden="true">
              <Shield className="h-8 w-8" />
              <Handshake className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
            </span>
            <span className="font-bold tracking-wide text-orange-400">Khidmaty · خدمتي</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-2 md:gap-3">
            <Link href="/about" className="rounded px-3 py-2 text-sm text-white transition-colors hover:bg-white/10">
              {tr(locale, 'footer.about')}
            </Link>
            <Link href="/terms" className="rounded px-3 py-2 text-sm text-white transition-colors hover:bg-white/10">
              {tr(locale, 'footer.terms')}
            </Link>
            <Link href="/privacy" className="rounded px-3 py-2 text-sm text-white transition-colors hover:bg-white/10">
              {tr(locale, 'footer.privacy')}
            </Link>
            <Link href="/contact" className="rounded px-3 py-2 text-sm text-white transition-colors hover:bg-white/10">
              {tr(locale, 'footer.contact')}
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-white/70">
          <p>
            &copy; {new Date().getFullYear()} Khidmaty · خدمتي. {tr(locale, 'footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
