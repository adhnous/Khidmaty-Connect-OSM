'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode, checkActionCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getClientLocale } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { formatMessage /*, success */ } from '@/lib/messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'verifyEmail' | 'resetPassword' | 'recoverEmail';

export default function AuthActionPage() {
  const locale = getClientLocale?.() ?? 'en';
  const { toast } = useToast();
  const params = useSearchParams();
  const router = useRouter();

  const mode = (params.get('mode') as Mode) || 'verifyEmail';
  const oobCode = params.get('oobCode');
  const continueUrl = params.get('continueUrl') || '/';

  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const title = useMemo(() => {
    switch (mode) {
      case 'verifyEmail': return locale === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify your email';
      case 'resetPassword': return locale === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset password';
      case 'recoverEmail': return locale === 'ar' ? 'استعادة البريد الإلكتروني' : 'Recover email';
      default: return 'Account';
    }
  }, [mode, locale]);

  useEffect(() => {
    if (!oobCode) return;
    (async () => {
      try {
        setStatus('working');
        await checkActionCode(auth, oobCode);

        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setStatus('done');
          // FIX: use a literal message (approved is not a valid key for `success`)
          toast({ title: locale === 'ar' ? 'تمّ تأكيد بريدك الإلكتروني' : 'Email verified' });
          setTimeout(() => router.replace(String(continueUrl || '/')), 1200);
        } else {
          // For resetPassword/recoverEmail we show the form or a message
          setStatus('idle');
        }
      } catch (e: any) {
        setStatus('error');
        setError(formatMessage(e?.code || e?.message || 'unknown', locale));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode, mode]);

  async function doReset() {
    if (!oobCode) return;
    if (!newPassword || newPassword.length < 6 || newPassword !== confirmPw) {
      setError(locale === 'ar' ? 'يرجى إدخال كلمة مرور صالحة ومطابقة.' : 'Please enter a valid, matching password.');
      return;
    }
    try {
      setStatus('working');
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('done');
      // this one is valid for `success`
      // toast({ title: success(locale, 'updated') });
      toast({ title: locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated' });
      setTimeout(() => router.replace('/login'), 1200);
    } catch (e: any) {
      setStatus('error');
      setError(formatMessage(e?.code || e?.message || 'unknown', locale));
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-background/70 p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === 'verifyEmail'
            ? (locale === 'ar' ? 'نقوم بتأكيد بريدك الإلكتروني الآن…' : 'We’re verifying your email…')
            : mode === 'resetPassword'
              ? (locale === 'ar' ? 'أدخل كلمة مرور جديدة.' : 'Enter a new password.')
              : (locale === 'ar' ? 'نستعيد بريدك الإلكتروني…' : 'Recovering your email…')}
        </p>

        {mode === 'resetPassword' && status !== 'done' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}</label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
            <Button className="w-full" onClick={doReset} disabled={status === 'working'}>
              {status === 'working'
                ? (locale === 'ar' ? 'جارٍ المعالجة…' : 'Working…')
                : (locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password')}
            </Button>
          </div>
        )}

        {status === 'working' && (
          <div className="mt-4 text-sm text-muted-foreground">
            {locale === 'ar' ? 'جارٍ المعالجة…' : 'Working…'}
          </div>
        )}

        {status === 'done' && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            {mode === 'verifyEmail'
              ? (locale === 'ar' ? 'تم تأكيد بريدك الإلكتروني.' : 'Your email has been verified.')
              : (locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح.' : 'Your password has been changed.')}
          </div>
        )}

        {status === 'error' && error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/login')}>
            {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign in'}
          </Button>
          <Button onClick={() => router.push(String(continueUrl || '/'))}>
            {locale === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Go home'}
          </Button>
        </div>
      </div>
    </div>
  );
}
