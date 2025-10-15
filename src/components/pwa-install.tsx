"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

// Lightweight i18n using the html[lang] attribute
function useLocale() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  
  useEffect(() => {
    const updateLocale = () => {
      try {
        const lang = document.documentElement.getAttribute('lang') || 'en';
        setLocale(lang.toLowerCase().startsWith('ar') ? 'ar' : 'en');
      } catch (error) {
        console.error('Error getting locale:', error);
        setLocale('en');
      }
    };

    updateLocale();

    // Optional: Observe for lang attribute changes
    const observer = new MutationObserver(updateLocale);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    return () => observer.disconnect();
  }, []);

  return locale;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  try {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    return /iphone|ipad|ipod/i.test(ua);
  } catch (error) {
    console.error('Error detecting iOS:', error);
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for display-mode standalone
    const isDisplayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
    
    // Check for iOS standalone mode
    const isIOSStandalone = (navigator as any).standalone === true;
    
    return !!(isDisplayModeStandalone || isIOSStandalone);
  } catch (error) {
    console.error('Error checking standalone mode:', error);
    return false;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstall() {
  const locale = useLocale();
  const [canInstall, setCanInstall] = useState(false);
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
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
        iosSteps: [
          'اضغط زر المشاركة أسفل Safari.',
          'اختر "إضافة إلى الشاشة الرئيسية".',
          'اضغط "إضافة" لتثبيت التطبيق.'
        ],
        androidSteps: [
          'افتح قائمة ⋮ في Chrome.',
          'اختر "تثبيت التطبيق" أو "Add to Home screen".',
          'أكد التثبيت لإضافة الأيقونة.'
        ]
      };
    }
    return {
      title: 'Install the app',
      descAndroid: 'Install Khidmaty on your device for a faster, app-like experience.',
      desciOS: 'On iOS: tap Share, then "Add to Home Screen" to install.',
      install: 'Install',
      how: 'How to install',
      close: 'Close',
      iosSteps: [
        'Tap the Share button at the bottom of Safari.',
        'Select "Add to Home Screen".',
        'Tap "Add" to install the app.'
      ],
      androidSteps: [
        'Open the ⋮ menu in Chrome.',
        'Select "Install app" or "Add to Home screen".',
        'Confirm installation to add the icon.'
      ]
    };
  }, [locale]);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) {
      setShow(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
      setShow(true);
    };

    const handleAppInstalled = () => {
      setShow(false);
      setCanInstall(false);
      deferredPromptRef.current = null;
      
      try {
        localStorage.setItem('pwa_installed', '1');
      } catch (error) {
        console.warn('Could not save installation state:', error);
      }
    };

    // Check if we should show for iOS (which doesn't support beforeinstallprompt)
    const ios = isIOS();
    if (ios) {
      // For iOS, we show the guide prompt directly
      setShow(true);
    }

    // Add event listeners for PWA installation
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    
    if (!promptEvent) {
      // No prompt available (likely iOS) - show guide instead
      setShowGuide(true);
      return;
    }

    try {
      // Show the install prompt
      await promptEvent.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await promptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShow(false);
      } else {
        console.log('User dismissed the install prompt');
        setShow(false);
      }
      
      // Clear the saved prompt since it can't be used again
      deferredPromptRef.current = null;
      setCanInstall(false);
    } catch (error) {
      console.error('Error during installation:', error);
      setShow(false);
    }
  };

  const handleClose = () => {
    setShow(false);
    
    try {
      // Remember dismissal for a period (e.g., 1 week)
      const dismissalDate = new Date();
      dismissalDate.setDate(dismissalDate.getDate() + 7);
      localStorage.setItem('pwa_dismissed', dismissalDate.toISOString());
    } catch (error) {
      console.warn('Could not save dismissal state:', error);
    }
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
  };

  // Don't render if not showing
  if (!show) return null;

  const isIphone = isIOS();
  const shouldShowInstallButton = !isIphone && canInstall;

  return (
    <>
      {/* Bottom bar (prominent) */}
      <div className="fixed inset-x-0 bottom-0 z-[60] pb-safe">
        <div className="mx-auto max-w-xl px-3">
          <div className="mb-2 rounded-t-xl border-x border-t border-ink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-2xl">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base">{l10n.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {isIphone ? l10n.desciOS : l10n.descAndroid}
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {shouldShowInstallButton ? (
                  <Button 
                    onClick={handleInstall} 
                    className="h-10 px-4 text-base"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" /> 
                    {l10n.install}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowGuide(true)} 
                    variant="default" 
                    className="h-10 px-4 text-base"
                    size="sm"
                  >
                    <Share className="mr-2 h-4 w-4" /> 
                    {l10n.how}
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className="h-9 w-9 p-0 shrink-0" 
                  onClick={handleClose} 
                  aria-label={l10n.close}
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Spacer to avoid overlap with bottom nav */}
        <div className="h-16 md:h-0" />
      </div>

      {/* Installation Guide Modal */}
      {showGuide && (
        <div 
          className="fixed inset-0 z-[70] bg-black/50 flex items-end justify-center p-4 md:items-center md:p-0"
          onClick={handleCloseGuide}
        >
          <div 
            className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-background p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{l10n.how}</h2>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0" 
                onClick={handleCloseGuide}
                aria-label={l10n.close}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {(isIphone ? l10n.iosSteps : l10n.androidSteps).map((step, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-copper text-ink text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              {shouldShowInstallButton && (
                <Button 
                  onClick={handleInstall} 
                  className="w-full h-11 text-base"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" /> 
                  {l10n.install}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}