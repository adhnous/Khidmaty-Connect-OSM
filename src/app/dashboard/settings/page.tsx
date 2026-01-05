"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/user';
import { getFcmToken, saveFcmToken, revokeFcmToken } from '@/lib/messaging';
import { resetPassword } from '@/lib/auth';

type ThemePreference = 'system' | 'light' | 'dark';

function getInitialLanguage(): 'en' | 'ar' {
  try {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/(?:^|; )locale=([^;]+)/);
    const fromCookie = (match?.[1] || '').toLowerCase();
    if (fromCookie.startsWith('ar')) return 'ar';
    if (fromCookie.startsWith('en')) return 'en';
    const fromHtml = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return fromHtml.startsWith('ar') ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function readStoredTheme(): ThemePreference | null {
  try {
    const raw = String(localStorage.getItem('theme') || '').toLowerCase().trim();
    if (raw === 'system' || raw === 'light' || raw === 'dark') return raw;
  } catch {
    // ignore
  }
  return null;
}

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [language, setLanguage] = useState<'en' | 'ar'>(getInitialLanguage());
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [tips, setTips] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const lastAutoSaveToastAt = useRef(0);

  const isAr = language === 'ar';

  useEffect(() => {
    const s = (userProfile as any)?.settings || {};
    const storedTheme = readStoredTheme();
    setTheme((s.theme as ThemePreference) || storedTheme || 'system');
    setLanguage((s.language as 'en' | 'ar') || getInitialLanguage());
    setEmailNotif(!!s.emailNotif);
    setPushNotif(!!s.pushNotif);
    setTips(!!s.tips);
    setLoaded(true);
  }, [userProfile]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prefersDark = typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', !!dark);
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (!user || !loaded) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await updateUserProfile(user.uid, { settings: { theme, language, emailNotif, pushNotif, tips } as any });
      } catch {
        const now = Date.now();
        // Rate-limit to avoid spamming toasts on flaky connections
        if (now - lastAutoSaveToastAt.current > 8000) {
          lastAutoSaveToastAt.current = now;
          toast({
            variant: 'destructive',
            title: isAr ? 'تعذّر الحفظ' : 'Save failed',
            description: isAr ? 'تحقق من الاتصال وحاول مرة أخرى.' : 'Check your connection and try again.',
          });
        }
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [user, loaded, theme, language, emailNotif, pushNotif, tips, toast, isAr]);

  const onChangePassword = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: isAr ? 'لا يوجد بريد إلكتروني في الحساب' : 'No email on account' });
      return;
    }
    try {
      await resetPassword(user.email);
      toast({ title: isAr ? 'تم إرسال رسالة إعادة تعيين كلمة المرور' : 'Password reset email sent' });
    } catch {
      toast({ variant: 'destructive', title: isAr ? 'تعذّر إرسال رسالة إعادة التعيين' : 'Could not send reset email' });
    }
  };

  const handleLanguage = (val: 'en' | 'ar') => {
    setLanguage(val);
    try {
      document.cookie = `locale=${val}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.setAttribute('lang', val);
      document.documentElement.setAttribute('dir', val === 'ar' ? 'rtl' : 'ltr');
    } catch {}
    try {
      router.refresh();
    } catch {}
  };

  const onTogglePush = async (checked: boolean) => {
    if (!user) return;
    setPushBusy(true);
    try {
      if (checked) {
        const token = await getFcmToken();
        if (!token) {
          toast({
            variant: 'destructive',
            title: isAr ? 'تعذّر تفعيل الإشعارات' : 'Enable failed',
            description: isAr
              ? 'تأكد من السماح بالإشعارات وإعداد Service Worker وVAPID Key.'
              : 'Make sure notifications are allowed and Service Worker + VAPID key are set.',
          });
          setPushNotif(false);
          return;
        }
        await saveFcmToken(user.uid, token);
        setPushNotif(true);
        toast({ title: isAr ? 'تم تفعيل الإشعارات' : 'Notifications enabled' });
      } else {
        await revokeFcmToken(user.uid);
        setPushNotif(false);
        toast({ title: isAr ? 'تم إيقاف الإشعارات' : 'Notifications disabled' });
      }
    } catch {
      toast({ variant: 'destructive', title: isAr ? 'حدث خطأ' : 'Something went wrong' });
    } finally {
      setPushBusy(false);
    }
  };

  const handleReset = () => {
    const s = (userProfile as any)?.settings || {};
    const storedTheme = readStoredTheme();
    setTheme((s.theme as ThemePreference) || storedTheme || 'system');
    setLanguage((s.language as 'en' | 'ar') || getInitialLanguage());
    setEmailNotif(!!s.emailNotif);
    setPushNotif(!!s.pushNotif);
    setTips(!!s.tips);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateUserProfile(user.uid, { settings: { theme, language, emailNotif, pushNotif, tips } as any });
      toast({ title: isAr ? 'تم الحفظ' : 'Saved' });
    } finally {
      setSaving(false);
    }
  };

  const copy = useMemo(() => {
    return {
      title: isAr ? 'الإعدادات' : 'Settings',
      subtitle: isAr ? 'إدارة التفضيلات، المظهر، والإشعارات.' : 'Manage preferences, theme, and notifications.',
      appearance: isAr ? 'المظهر' : 'Appearance',
      appearanceSubtitle: isAr ? 'تحكم في المظهر واللغة.' : 'Control theme and language.',
      theme: isAr ? 'السمة' : 'Theme',
      system: isAr ? 'النظام' : 'System',
      light: isAr ? 'فاتح' : 'Light',
      dark: isAr ? 'داكن' : 'Dark',
      language: isAr ? 'اللغة' : 'Language',
      arabic: isAr ? 'العربية' : 'Arabic',
      notifications: isAr ? 'الإشعارات' : 'Notifications',
      notificationsSubtitle: isAr ? 'اختر طريقة استلام الإشعارات.' : 'Choose how you want to be notified.',
      emailNotif: isAr ? 'إشعارات البريد الإلكتروني' : 'Email notifications',
      emailNotifHint: isAr ? 'تحديثات حول خدماتك وحسابك' : 'Updates about your services and account',
      pushNotif: isAr ? 'إشعارات فورية' : 'Push notifications',
      pushNotifHint: isAr ? 'تنبيهات فورية على هذا الجهاز' : 'Real-time alerts on this device',
      tips: isAr ? 'نصائح وشروحات' : 'Tips & tutorials',
      tipsHint: isAr ? 'نصائح بين الحين والآخر لمساعدتك على الاستفادة من المنصة' : 'Occasional product tips to help you succeed',
      account: isAr ? 'الحساب' : 'Account',
      accountSubtitle: isAr ? 'إعدادات الأمان والخصوصية.' : 'Security and privacy controls.',
      changePassword: isAr ? 'تغيير كلمة المرور' : 'Change password',
      deleteAccount: isAr ? 'حذف الحساب' : 'Delete account',
      notImplemented: isAr ? 'غير متوفر حالياً' : 'Not implemented',
      autosave: isAr ? 'يتم حفظ التغييرات تلقائياً في هذه الصفحة.' : 'Your changes are saved automatically on this page.',
      saving: isAr ? 'جارٍ الحفظ…' : 'Saving…',
      reset: isAr ? 'إعادة ضبط' : 'Reset',
      saveChanges: isAr ? 'حفظ التغييرات' : 'Save changes',
    };
  }, [isAr]);

  return (
    <div className="ds-page">
      <div className="ds-container space-y-6">
        <div className="ds-hero">
          <div className="ds-hero-content">
            <h1 className="ds-title">{copy.title}</h1>
            <p className="ds-subtitle">{copy.subtitle}</p>
          </div>
        </div>

        <div className="ds-grid-3">
          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">{copy.appearance}</h2>
              <p className="ds-section-subtitle">{copy.appearanceSubtitle}</p>
            </div>
            <div className="ds-card-section grid gap-4">
              <div className="grid gap-2">
                <label className="ds-label">{copy.theme}</label>
                <select className="ds-select" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                  <option value="system">{copy.system}</option>
                  <option value="light">{copy.light}</option>
                  <option value="dark">{copy.dark}</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="ds-label">{copy.language}</label>
                <select className="ds-select" value={language} onChange={(e) => handleLanguage(e.target.value as any)}>
                  <option value="en">English</option>
                  <option value="ar">{copy.arabic}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">{copy.notifications}</h2>
              <p className="ds-section-subtitle">{copy.notificationsSubtitle}</p>
            </div>
            <div className="ds-card-section space-y-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">{copy.emailNotif}</div>
                  <div className="text-sm text-muted-foreground">{copy.emailNotifHint}</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">{copy.pushNotif}</div>
                  <div className="text-sm text-muted-foreground">{copy.pushNotifHint}</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={pushNotif} onChange={(e) => onTogglePush(e.target.checked)} disabled={pushBusy} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">{copy.tips}</div>
                  <div className="text-sm text-muted-foreground">{copy.tipsHint}</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={tips} onChange={(e) => setTips(e.target.checked)} />
              </label>
            </div>
          </section>

          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">{copy.account}</h2>
              <p className="ds-section-subtitle">{copy.accountSubtitle}</p>
            </div>
            <div className="ds-card-section space-y-4">
              <button className="ds-btn ds-btn-outline w-full" onClick={onChangePassword}>{copy.changePassword}</button>
              <button
                className="ds-btn ds-btn-danger w-full"
                onClick={() => toast({ variant: 'destructive', title: copy.notImplemented })}
              >
                {copy.deleteAccount}
              </button>
            </div>
          </section>
        </div>

        <div className="ds-toolbar">
          <div className="text-sm text-muted-foreground">{saving ? copy.saving : copy.autosave}</div>
          <div className="flex gap-2">
            <button className="ds-btn ds-btn-outline" onClick={handleReset} disabled={!loaded || saving}>{copy.reset}</button>
            <button className="ds-btn ds-btn-primary" onClick={handleSave} disabled={!loaded || saving}>{copy.saveChanges}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
