"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

// Lightweight i18n using the html[lang] attribute
function useLocale() {
  const [locale, setLocale] = useState<'en' | 'ar'>(() => {
    try {
      const l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      return l.startsWith('ar') ? 'ar' : 'en';
    } catch { return 'en'; }
  });
  useEffect(() => {
    try {
      const l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      setLocale(l.startsWith('ar') ? 'ar' : 'en');
    } catch {}
  }, []);
  return locale;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iphone|ipad|ipod/i.test(ua);
}

export default function PwaInstall() {
  const locale = useLocale();
  const [canInstall, setCanInstall] = useState(false);
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  const l10n = useMemo(() => {
    if (locale === 'ar') {
      return {
        title: 'ثبّت التطبيق',
        descAndroid: 'يمكنك تثبيت تطبيق خدماتي على جهازك لاستخدامه بسرعة وسهولة.',
        desciOS: 'لتثبيت التطبيق على iOS، اضغط مشاركة ثم "إضافة إلى الشاشة الرئيسية".',
        install: 'تثبيت',
        how: 'طريقة التثبيت',
        close: 'إغلاق',
      };
    }
    return {
      title: 'Install the app',
      descAndroid: 'Install Khidmaty on your device for a faster, app-like experience.',
      desciOS: 'On iOS: tap Share, then "Add to Home Screen" to install.',
      install: 'Install',
      how: 'How to install',
      close: 'Close',
    };
  }, [locale]);

  // Do not show again for a while after dismiss
  // Persistence behavior: always re-show until installed (no cooldown)
  const dismissedRecently = () => false;
  const markDismissed = () => {};

  useEffect(() => {
    // Already installed? Don't show
    const isStandalone = (() => {
      try {
        const mm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        // @ts-ignore iOS Safari
        const iosStandalone = (navigator as any).standalone === true;
        return !!(mm || iosStandalone);
      } catch { return false; }
    })();
    if (isStandalone || dismissedRecently()) return;

    const onBeforeInstall = (e: any) => {
      // Chrome on Android
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
      setShow(true);
    };

    const onInstalled = () => {
      setShow(false);
      setCanInstall(false);
      try { localStorage.setItem('pwa_installed', '1'); } catch {}
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as any);
    window.addEventListener('appinstalled', onInstalled as any);

    // iOS won't fire beforeinstallprompt; show an info bar instead
    if (isIOS()) {
      setShow(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as any);
      window.removeEventListener('appinstalled', onInstalled as any);
    };
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    const evt = deferredPromptRef.current;
    if (!evt) {
      // No prompt available (likely iOS)
      return;
    }
    try {
      evt.prompt();
      const choice = await evt.userChoice;
      if (choice?.outcome === 'accepted') {
        setShow(false);
      } else {
        setShow(false);
      }
    } catch {
      setShow(false);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  const isIphone = isIOS();

  return (
    <>
      {/* Bottom bar (prominent) */}
      <div className="fixed inset-x-0 bottom-0 z-[60] pb-safe">
        <div className="mx-auto max-w-xl px-3">
          <div className="mb-2 rounded-t-xl border-x border-t border-ink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-2xl">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="font-semibold text-base">{l10n.title}</div>
                <div className="text-sm text-muted-foreground">
                  {isIphone ? l10n.desciOS : (canInstall ? l10n.descAndroid : l10n.descAndroid)}
                </div>
              </div>
              {!isIphone && canInstall ? (
                <Button onClick={handleInstall} className="h-10 px-4 text-base">
                  <Download className="mr-2 h-5 w-5" /> {l10n.install}
                </Button>
              ) : (
                <Button onClick={() => setShowGuide(true)} variant="default" className="h-10 px-4 text-base">
                  <Share className="mr-2 h-5 w-5" /> {l10n.how}
                </Button>
              )}
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={handleClose} aria-label={l10n.close}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Spacer to avoid overlap with bottom nav */}
        <div className="h-16 md:h-0" />
      </div>

      {/* Simple overlay guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[70] bg-black/50">
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-2xl bg-background p-4 pb-safe shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">{l10n.how}</div>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setShowGuide(false)} aria-label={l10n.close}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {isIphone ? (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/80">
                <li>اضغط زر المشاركة أسفل Safari.</li>
                <li>اختر "إضافة إلى الشاشة الرئيسية".</li>
                <li>اضغط "إضافة" لتثبيت التطبيق.</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/80">
                <li>افتح قائمة ⋮ في Chrome.</li>
                <li>اختر "تثبيت التطبيق" أو "Add to Home screen".</li>
                <li>أكد التثبيت لإضافة الأيقونة.</li>
              </ol>
            )}
            <div className="mt-4">
              {!isIphone && canInstall && (
                <Button onClick={handleInstall} className="w-full h-11 text-base">
                  <Download className="mr-2 h-5 w-5" /> {l10n.install}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
