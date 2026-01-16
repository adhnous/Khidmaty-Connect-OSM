'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientLocale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export default function PythonSandboxPage() {
  const locale = getClientLocale();
  const router = useRouter();

  return (
    <div className="ds-container py-6 md:py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-copper/20 via-copperLight/10 to-power/15">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Python Sandbox
              </h1>
              <p className="mt-1 text-sm text-ink/80">
                Practice Python in your browser.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit border-ink/20 bg-snow/40 text-ink hover:bg-snow/50"
              onClick={() => {
                try {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/');
                  }
                } catch {
                  router.push('/');
                }
              }}
            >
              {locale === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          </div>
          <div className="mt-3 text-xs text-ink/70">
            <span className="font-medium">
              {locale === 'ar' ? 'ملاحظة:' : 'Note:'}
            </span>{' '}
            {locale === 'ar'
              ? 'قد تظهر رسائل في Console من الإطار الخارجي وهذا طبيعي.'
              : 'External iframe console messages are normal.'}{' '}
            <Link className="ds-link" href="/practice/postman">
              {locale === 'ar' ? 'جرّب Mini Postman' : 'Try Mini Postman'}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[12px] border border-black/10 bg-background shadow-sm">
        <div
          aria-hidden="true"
          className="absolute right-1 top-1 z-10 h-8 w-8 rounded-full bg-background"
        />
        <iframe
          title="JupyterLite Python REPL"
          src="https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1"
          // Cross-origin iframe: sandbox blocks popups (e.g. "open in new tab") without breaking the REPL.
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className="h-[80vh] min-h-[75vh] w-full"
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Runs Python in your browser (JupyterLite). No installation required.
      </p>
    </div>
  );
}
