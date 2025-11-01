"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/user';
import { getFcmToken, saveFcmToken, revokeFcmToken } from '@/lib/messaging';
import { resetPassword } from '@/lib/auth';

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState<'en' | 'ar'>(typeof document !== 'undefined' && document.documentElement.getAttribute('lang')?.toLowerCase().startsWith('ar') ? 'ar' : 'en');
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [tips, setTips] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    const s = (userProfile as any)?.settings || {};
    if (s) {
      setTheme(s.theme || 'system');
      setLanguage(s.language || (typeof document !== 'undefined' && document.documentElement.getAttribute('lang')?.toLowerCase().startsWith('ar') ? 'ar' : 'en'));
      setEmailNotif(!!s.emailNotif);
      setPushNotif(!!s.pushNotif);
      setTips(!!s.tips);
      setLoaded(true);
    }
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
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [user, loaded, theme, language, emailNotif, pushNotif, tips]);

  const onChangePassword = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'الحساب بلا بريد' : 'No email on account' });
      return;
    }
    try {
      await resetPassword(user.email);
      toast({ title: language === 'ar' ? 'تم إرسال رابط إعادة التعيين' : 'Password reset email sent' });
    } catch {
      toast({ variant: 'destructive', title: language === 'ar' ? 'تعذر إرسال الرابط' : 'Could not send reset email' });
    }
  };

  const handleLanguage = (val: 'en' | 'ar') => {
    setLanguage(val);
    try { document.cookie = `locale=${val}; path=/; max-age=31536000; samesite=lax`; } catch {}
    if (typeof window !== 'undefined') window.location.reload();
  };

  const onTogglePush = async (checked: boolean) => {
    if (!user) return;
    setPushBusy(true);
    try {
      if (checked) {
        const token = await getFcmToken();
        if (!token) {
          toast({ variant: 'destructive', title: language === 'ar' ? 'فشل تفعيل الإشعارات' : 'Enable failed' });
          setPushNotif(false);
          return;
        }
        await saveFcmToken(user.uid, token);
        setPushNotif(true);
        toast({ title: language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled' });
      } else {
        await revokeFcmToken(user.uid);
        setPushNotif(false);
        toast({ title: language === 'ar' ? 'تم إيقاف الإشعارات' : 'Notifications disabled' });
      }
    } finally {
      setPushBusy(false);
    }
  };

  const handleReset = () => {
    const s = (userProfile as any)?.settings || {};
    setTheme(s.theme || 'system');
    setLanguage(s.language || (typeof document !== 'undefined' && document.documentElement.getAttribute('lang')?.toLowerCase().startsWith('ar') ? 'ar' : 'en'));
    setEmailNotif(!!s.emailNotif);
    setPushNotif(!!s.pushNotif);
    setTips(!!s.tips);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateUserProfile(user.uid, { settings: { theme, language, emailNotif, pushNotif, tips } as any });
      toast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ds-page">
      <div className="ds-container space-y-6">
        <div className="ds-hero">
          <div className="ds-hero-content">
            <h1 className="ds-title">Settings</h1>
            <p className="ds-subtitle">Manage preferences, theme, and notifications.</p>
          </div>
        </div>

        <div className="ds-grid-3">
          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">Appearance</h2>
              <p className="ds-section-subtitle">Control theme and language.</p>
            </div>
            <div className="ds-card-section grid gap-4">
              <div className="grid gap-2">
                <label className="ds-label">Theme</label>
                <select className="ds-select" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="ds-label">Language</label>
                <select className="ds-select" value={language} onChange={(e) => handleLanguage(e.target.value as any)}>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </section>

          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">Notifications</h2>
              <p className="ds-section-subtitle">Choose how you want to be notified.</p>
            </div>
            <div className="ds-card-section space-y-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">Email notifications</div>
                  <div className="text-sm text-muted-foreground">Updates about your services and account</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">Push notifications</div>
                  <div className="text-sm text-muted-foreground">Real-time alerts on this device</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={pushNotif} onChange={(e) => onTogglePush(e.target.checked)} disabled={pushBusy} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="ds-label">Tips & tutorials</div>
                  <div className="text-sm text-muted-foreground">Occasional product tips to help you succeed</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={tips} onChange={(e) => setTips(e.target.checked)} />
              </label>
            </div>
          </section>

          <section className="ds-card">
            <div className="ds-card-section">
              <h2 className="ds-section-title">Account</h2>
              <p className="ds-section-subtitle">Security and privacy controls.</p>
            </div>
            <div className="ds-card-section space-y-4">
              <button className="ds-btn ds-btn-outline w-full" onClick={onChangePassword}>Change password</button>
              <button className="ds-btn ds-btn-danger w-full" onClick={() => toast({ variant: 'destructive', title: language === 'ar' ? 'غير متاح' : 'Not implemented' })}>Delete account</button>
            </div>
          </section>
        </div>

        <div className="ds-toolbar">
          <div className="text-sm text-muted-foreground">Your changes are saved automatically on this page.</div>
          <div className="flex gap-2">
            <button className="ds-btn ds-btn-outline" onClick={handleReset} disabled={saving}>Reset</button>
            <button className="ds-btn ds-btn-primary" onClick={handleSave} disabled={saving}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
