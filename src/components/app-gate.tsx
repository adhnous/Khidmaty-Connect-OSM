"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getFeatures } from "@/lib/settings";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const f = await getFeatures();
        if (!alive) return;
        setFeatures(f);
      } finally {
        if (alive) setFeaturesLoaded(true);
      }
    })();
    return () => { alive = false };
  }, []);

  useEffect(() => {
    if (!user) return; // apply lock only for signed-in users

    const role = userProfile?.role || null;
    const plan = (userProfile?.plan ?? 'free') as string;
    const pg: any = (userProfile as any)?.pricingGate || {};

    // Allow these routes without redirect to avoid loop
    const allow = (p: string) => p.startsWith('/pricing') || p.startsWith('/login') || p.startsWith('/verify') || p.startsWith('/_next') || p.startsWith('/api');

    // Owner/admin bypass
    if (role === 'owner' || role === 'admin') return;

    // Per-user force_show should not depend on features loading
    const forced = pg?.mode === 'force_show';
    if (forced && !allow(pathname)) {
      router.replace('/pricing');
      return;
    }

    // Role locks depend on features
    if (!featuresLoaded || !features) return;
    const lockedByRole = !!(features.lockAllToPricing || (role === 'provider' && features.lockProvidersToPricing) || (role === 'seeker' && features.lockSeekersToPricing));
    if (lockedByRole && plan === 'free' && !allow(pathname)) {
      router.replace('/pricing');
    }
  }, [featuresLoaded, features, pathname, user?.uid, userProfile?.role, userProfile?.plan, (userProfile as any)?.pricingGate, router]);

  return <>{children}</>;
}
