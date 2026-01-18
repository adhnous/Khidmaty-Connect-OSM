
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getClientLocale, tr } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { getFeatures } from '@/lib/settings';
import { updateUserProfile } from '@/lib/user';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const locale = getClientLocale();
  const [showPricingBanner, setShowPricingBanner] = useState(false);
  const [profileBootstrapStarted, setProfileBootstrapStarted] = useState(false);
  const [profileBootstrapError, setProfileBootstrapError] = useState<string | null>(null);
  const canAccessDashboard =
    userProfile?.role === 'provider' ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'owner';

  useEffect(() => {
    if (loading) return;
    // Not signed in -> login
    if (!user) {
      router.push('/login');
      return;
    }
    // Signed in but email not verified -> verify first
    if (user && !user.emailVerified) {
      router.push('/verify');
      return;
    }

    // First-time sign-in: profile may not exist yet. Attempt a bootstrap and wait.
    if (user && !userProfile && !profileBootstrapStarted) {
      setProfileBootstrapStarted(true);
      (async () => {
        try {
          await updateUserProfile(
            user.uid,
            {
              role: 'provider',
              displayName: user.displayName || undefined,
              photoURL: user.photoURL || undefined,
            },
            { authEmail: user.email || null }
          );
        } catch (e: any) {
          setProfileBootstrapError(
            e?.message ||
              'Could not create your profile. Please try again or contact support.'
          );
        }
      })();
      return;
    }
    // Signed in but not a provider (or missing profile) -> send home (seekers cannot access provider dashboard)
    if (user && userProfile && !canAccessDashboard) {
      router.push('/');
    }
  }, [user, userProfile, canAccessDashboard, loading, router, profileBootstrapStarted]);

  // Pricing enforcement: if force_show and plan is free, redirect to /pricing.
  // Otherwise, show a banner CTA when pricing is visible for this provider but plan is still free.
  useEffect(() => {
    if (loading) return;
    if (!user || userProfile?.role !== 'provider') return;
    (async () => {
      try {
        const f = await getFeatures();
        const pg: any = (userProfile as any)?.pricingGate || {};
        if (pg?.mode === 'force_hide') { setShowPricingBanner(false); return; }
        if (pg?.mode === 'force_show') {
          if ((userProfile?.plan ?? 'free') === 'free') {
            router.replace('/pricing');
          }
          setShowPricingBanner(false);
          return;
        }
        const createdAtMs =
          (userProfile as any)?.createdAt?.toMillis?.() ??
          (user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0);
        const monthsSince = createdAtMs > 0 ? (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24 * 30) : 0;
        const monthsLimit = (typeof pg?.enforceAfterMonths === 'number') ? pg.enforceAfterMonths : (f.enforceAfterMonths ?? 3);
        const byRole = f.showForProviders === true;
        const byAge = monthsSince >= monthsLimit;
        const allowed = !!(f.pricingEnabled && (byRole || byAge));
        setShowPricingBanner(allowed && ((userProfile?.plan ?? 'free') === 'free'));
      } catch {
        setShowPricingBanner(false);
      }
    })();
  }, [loading, user?.uid, userProfile?.role, userProfile?.plan, router]);
  
  if (loading || !user) {
    return null; // Or a loading spinner
  }

  // While profile is being created, show a friendly placeholder instead of redirecting.
  if (!userProfile) {
    return (
      <main className="mx-auto max-w-2xl p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-bold">Setting up your account…</h1>
        <p className="text-muted-foreground">
          Creating your provider profile. This usually takes a moment.
        </p>
        {profileBootstrapError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
            {profileBootstrapError}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            className="ds-btn ds-btn-primary"
            onClick={() => router.replace('/login')}
          >
            Back to login
          </button>
          <button className="ds-btn ds-btn-ghost" onClick={() => router.refresh()}>
            Retry
          </button>
        </div>
      </main>
    );
  }
  // If seeker (or missing profile) somehow lands here before redirect finishes, render a friendly message instead of provider UI
  if (!canAccessDashboard) {
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-bold">For Providers Only</h1>
        <p className="text-muted-foreground">
          Your account is a seeker. Service creation and provider dashboard are available only to provider accounts.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      {showPricingBanner && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-50 p-4 text-yellow-900">
          <div className="mb-2 font-semibold">Upgrade your plan</div>
          <div className="mb-3 text-sm">Unlock more features and visibility. Choose a plan to continue.</div>
          <Link href="/pricing" className="inline-flex items-center rounded bg-copper px-3 py-1.5 text-sm font-semibold text-ink hover:bg-copperDark">
            View plans
          </Link>
        </div>
      )}
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}
