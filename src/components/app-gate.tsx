"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getFeatures } from "@/lib/settings";
import { signOut } from "@/lib/auth";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth() as any;
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
    // Wait for auth/profile to finish loading to avoid false sign-outs
    if (loading) return;
    // If the user is authenticated but their profile doc is missing or disabled, sign them out and send to login
    if (user && (!userProfile || (userProfile as any)?.status === 'disabled')) {
      (async () => {
        try { await signOut(); } finally { router.replace('/login'); }
      })();
      return;
    }

    if (!user) return; // apply lock only for signed-in users

    const role = userProfile?.role || null;
    const plan = (userProfile?.plan ?? 'free') as string;
    const pg: any = (userProfile as any)?.pricingGate || {};

    // Allow these routes without redirect to avoid loop
    const allow = (p: string) => p.startsWith('/pricing') || p.startsWith('/checkout') || p.startsWith('/login') || p.startsWith('/verify') || p.startsWith('/_next') || p.startsWith('/api');

    // Global email verification enforcement: if the Firebase Auth user is not verified,
    // force them to the /verify page regardless of role/locks.
    if (!user.emailVerified && !allow(pathname)) {
      router.replace('/verify');
      return;
    }

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
