'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClientLocale } from '@/lib/i18n';
import { getIdTokenOrThrow } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

type MyResource = {
  id: string;
  title: string;
  type: string;
  language: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  hasFile: boolean;
  createdAt: string | null;
};

export default function MyStudentResourcesPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';

  const [items, setItems] = useState<MyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getIdTokenOrThrow();
        const res = await fetch('/api/student-bank/my', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || res.statusText);
        if (!cancelled) {
          setItems(Array.isArray(json.items) ? json.items : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.message === 'not_signed_in'
              ? isAr
                ? 'U�O1O�O� O�O�O3OU, OU,U.U^O�O_ U^O�O\"O�U�O OU,O�U+.'
                : 'Please sign in to view your uploaded resources.'
              : isAr
              ? 'O�O1O�O� O�O�O3OU, OU,U.U^O�O_ OU,O�O�O�USO\"US OU,O�U+.'
              : 'Failed to load your uploaded resources.';
          setError(msg);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAr]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-8 md:py-10">
          <div
            className={`mb-4 flex flex-col gap-2 ${
              isAr ? 'items-end text-right' : 'items-start text-left'
            }`}
          >
            <h1 className="text-xl font-bold md:text-2xl">
              {isAr ? 'O�O�O�O�O"Oc OU,O�O�O�USO\"US' : 'My uploaded resources'}
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'O�O�O�USO\"US OU,U,U.O-O�O� U^U.U^O3OO�O� OU,U^OO�U�Oc (pending) O�O�O� (approved) O�U^O�O_ (rejected).'
                : 'See the resources you have uploaded, along with their status: pending review, approved or rejected.'}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student-bank">
                {isAr ? 'OU,O1U^O_Oc O�U,U% OU,OrO_U.OO�' : 'Back to Student Bank'}
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-4 text-xs md:text-sm">
            {error && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 md:text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted/60" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? 'U,O O�U^O�O_ U.U^OO�O_ O�O�O�USO\"US OU,O�U+ U^U.U,O3OO1O_.'
                  : 'You have not uploaded any resources yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-xs shadow-sm md:flex-row md:items-center md:justify-between md:p-4 md:text-sm"
                  >
                    <div className={isAr ? 'text-right' : 'text-left'}>
                      <h3 className="font-semibold text-foreground">
                        {r.title || (isAr ? '(�?� �?�U.O�)' : '(no title)')}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground md:text-xs">
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {r.type || 'other'}
                        </span>
                        {r.language && (
                          <span className="rounded-full bg-muted px-2 py-0.5">
                            {r.language === 'ar'
                              ? 'AR'
                              : r.language === 'en'
                              ? 'EN'
                              : 'AR + EN'}
                          </span>
                        )}
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor:
                              r.status === 'approved'
                                ? '#dcfce7'
                                : r.status === 'rejected'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              r.status === 'approved'
                                ? '#166534'
                                : r.status === 'rejected'
                                ? '#991b1b'
                                : '#92400e',
                          }}
                        >
                          {r.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col items-start gap-1 text-[11px] text-muted-foreground md:mt-0 md:items-end md:text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ID: {r.id}
                      </span>
                      <span>
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : isAr
                          ? 'O�U^O�O_ OU,U^OO�U�Oc'
                          : 'Created date unknown'}
                      </span>
                      {r.hasFile && (
                        <span>
                          {isAr ? 'O�O�O�USO\"US O1O�O �?� Google Drive' : 'File stored in Google Drive'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

