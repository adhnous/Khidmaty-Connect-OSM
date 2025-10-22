'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function PrivateDashboardPage() {
  const { user, loading } = useAuth() as any;
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!user) return;
        const token = await user.getIdToken(true);
        const res = await fetch('/api/mb-embed', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { url?: string };
        if (!data.url) throw new Error('Missing embed URL');
        if (!cancelled) setUrl(data.url);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please <a className="underline" href="/login">sign in</a> to view your private analytics.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold">Unable to load dashboard</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-sm text-muted-foreground">Preparing your dashboard…</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-6">
      <div className="w-full">
        <iframe
          src={url}
          style={{ width: '100%', height: '80vh', border: 0 }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
