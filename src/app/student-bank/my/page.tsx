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
                ? 'الرجاء تسجيل الدخول لعرض ملفاتك المرفوعة.'
                : 'Please sign in to view your uploaded resources.'
              : isAr
              ? 'فشل في تحميل ملفاتك المرفوعة.'
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
              {isAr ? 'مصادري التي رفعتها' : 'My uploaded resources'}
            </h1>

            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'شاهد الموارد التي قمت برفعها مع حالة كل مورد: قيد المراجعة، مقبول، أو مرفوض.'
                : 'See the resources you have uploaded, along with their status: pending review, approved or rejected.'}
            </p>

            <Button variant="outline" size="sm" asChild>
              <Link href="/student-bank">
                {isAr ? 'العودة إلى بنك الطالب' : 'Back to Student Bank'}
              </Link>
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 md:text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border bg-muted/60"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'لم تقم برفع أي موارد بعد.'
                : 'You have not uploaded any resources yet.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border bg-background/60 p-3 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg md:p-4 md:text-sm"
                >
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground md:text-base">
                      {r.title || (isAr ? '(بدون عنوان)' : '(no title)')}
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

                  <div
                    className={`mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground md:mt-0 md:text-xs ${
                      isAr ? 'items-start md:items-start' : 'items-start md:items-end'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ID: {r.id}
                    </span>
                    <span>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : isAr
                        ? 'تاريخ الإنشاء غير معروف'
                        : 'Created date unknown'}
                    </span>

                    {r.hasFile && (
                      <span>
                        {isAr
                          ? 'الملف مخزّن في Google Drive'
                          : 'File attached'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
