"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Briefcase, User, LogIn, Tag } from "lucide-react";
import { tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { getFeatures } from "@/lib/settings";

export default function BottomNav() {
  const { user, userProfile } = useAuth();
  const pathname = usePathname() || "/";
  const [locale, setLocale] = useState<'en' | 'ar'>(() => {
    try {
      const fromHtml = (typeof document !== 'undefined' ? (document.documentElement.getAttribute('lang') || 'en') : 'en').toLowerCase();
      return fromHtml.startsWith('ar') ? 'ar' : 'en';
    } catch { return 'en'; }
  });
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    try {
      const fromHtml = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      setLocale(fromHtml.startsWith('ar') ? 'ar' : 'en');
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const f = await getFeatures();
        if (!alive) return;
        const role = userProfile?.role;
        const plan = (userProfile?.plan ?? 'free') as string;
        const lockedByRole = !!(f.lockAllToPricing || (role === 'provider' && f.lockProvidersToPricing) || (role === 'seeker' && f.lockSeekersToPricing));
        const pg: any = (userProfile as any)?.pricingGate || {};
        const forcedShow = pg?.mode === 'force_show';
        const show = forcedShow || lockedByRole || !!f.pricingEnabled;
        setShowPricing(show);
      } catch {
        setShowPricing(false);
      }
    })();
    return () => { alive = false };
  }, [user?.uid, userProfile?.role, (userProfile as any)?.pricingGate, userProfile?.plan]);

  const isActive = (href: string) => {
    try {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    } catch { return false; }
  };

  // Hide on md+ screens
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden pb-safe">
      <ul className="grid grid-cols-4">
        <li>
          <Link href="/" className={`flex flex-col items-center justify-center py-2 text-sm ${isActive('/') ? 'text-primary font-semibold' : ''}`} aria-current={isActive('/') ? 'page' : undefined}>
            <Home className={`h-5 w-5 ${isActive('/') ? 'text-primary' : ''}`} />
            <span>{tr(locale, 'header.browse')}</span>
          </Link>
        </li>
        {showPricing && (
          <li>
            <Link href="/pricing" className={`flex flex-col items-center justify-center py-2 text-sm ${isActive('/pricing') ? 'text-primary font-semibold' : ''}`} aria-current={isActive('/pricing') ? 'page' : undefined}>
              <Tag className={`h-5 w-5 ${isActive('/pricing') ? 'text-primary' : ''}`} />
              <span>{tr(locale, 'pages.pricing.nav')}</span>
            </Link>
          </li>
        )}
        <li>
          {userProfile?.role === 'provider' ? (
            <Link href="/dashboard" className={`flex flex-col items-center justify-center py-2 text-sm ${isActive('/dashboard') ? 'text-primary font-semibold' : ''}`} aria-current={isActive('/dashboard') ? 'page' : undefined}>
              <Briefcase className={`h-5 w-5 ${isActive('/dashboard') ? 'text-primary' : ''}`} />
              <span>{tr(locale, 'header.providerDashboard')}</span>
            </Link>
          ) : (
            <span className="flex flex-col items-center justify-center py-2 text-sm opacity-50">
              <Briefcase className="h-5 w-5" />
              <span>{tr(locale, 'header.providerDashboard')}</span>
            </span>
          )}
        </li>
        <li>
          {user ? (
            <Link href="/dashboard/profile" className={`flex flex-col items-center justify-center py-2 text-sm ${isActive('/dashboard/profile') ? 'text-primary font-semibold' : ''}`} aria-current={isActive('/dashboard/profile') ? 'page' : undefined}>
              <User className={`h-5 w-5 ${isActive('/dashboard/profile') ? 'text-primary' : ''}`} />
              <span>{tr(locale, 'header.profile')}</span>
            </Link>
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-center py-2 text-sm">
              <LogIn className="h-5 w-5" />
              <span>{tr(locale, 'header.login')}</span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
