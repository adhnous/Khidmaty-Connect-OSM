"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

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
  const dismissedRecently = () => {
    try {
      const ts = Number(localStorage.getItem('pwa_install_dismissed_at') || '0');
      if (!ts) return false;
      const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      return days < 3; // 3 days cooldown
    } catch { return false; }
  };

  const markDismissed = () => {
    try { localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); } catch {}
  };

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
        markDismissed();
        setShow(false);
      }
    } catch {
      markDismissed();
      setShow(false);
    }
  };

  const handleClose = () => {
    markDismissed();
    setShow(false);
  };

  const isIphone = isIOS();

  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] px-3 md:bottom-6">
      <div className="mx-auto max-w-md rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-lg p-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="font-semibold">{l10n.title}</div>
          <div className="text-sm text-muted-foreground">
            {isIphone ? l10n.desciOS : l10n.descAndroid}
          </div>
        </div>
        {!isIphone && canInstall && (
          <Button onClick={handleInstall} className="h-9 px-3">
            <Download className="mr-2 h-4 w-4" /> {l10n.install}
          </Button>
        )}
        <Button variant="ghost" className="h-9 w-9 p-0" onClick={handleClose} aria-label={l10n.close}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
