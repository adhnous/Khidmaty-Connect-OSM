'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getGoogleRedirectResult,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOut,
} from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, type UserProfile } from '@/lib/user';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

async function ensureProviderProfile(user: User): Promise<UserProfile | null> {
  let profile = await getUserProfile(user.uid);
  if (profile) return profile;

  // Create provider profile for new Google users.
  await createUserProfile(user.uid, user.email || '', 'provider');

  // Firestore can be eventually consistent; retry briefly.
  for (let i = 0; i < 5; i++) {
    profile = await getUserProfile(user.uid);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignedInUser = useCallback(
    async (user: User) => {
      const profile = await ensureProviderProfile(user);
      if (!profile) {
        toast({
          variant: 'destructive',
          title: 'Profile not ready',
          description: 'Could not load your profile. Please try again.',
        });
        await signOut().catch(() => {});
        return;
      }

      const role = profile.role;
      const allowed = role === 'provider' || role === 'admin' || role === 'owner';
      if (!allowed) {
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'This login is for service providers only.',
        });
        await signOut().catch(() => {});
        return;
      }

      router.push('/dashboard');
    },
    [router, toast]
  );

  // If we returned from Google redirect login, consume the redirect result.
  // Also auto-redirect signed-in users away from /login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setGoogleLoading(true);
        const result = await getGoogleRedirectResult().catch(() => null);
        const u = result?.user ?? auth.currentUser;
        if (!u || cancelled) return;
        await handleSignedInUser(u);
      } catch (error: any) {
        if (cancelled) return;
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: error?.message || 'Could not complete Google sign-in.',
        });
      } finally {
        if (!cancelled) setGoogleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleSignedInUser, toast]);

  const doGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      await handleSignedInUser(userCredential.user);
    } catch (error: any) {
      const code = String(error?.code || '');
      const msg = String(error?.message || '');

      // Some environments block popups due to COOP policies. Fall back to redirect.
      const shouldRedirect =
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        msg.includes('Cross-Origin-Opener-Policy');

      if (shouldRedirect) {
        toast({
          title: 'Switching to redirect sign-in',
          description: 'Popup was blocked. Redirecting to Google.',
        });
        await signInWithGoogleRedirect();
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: error?.message || 'Could not sign in with Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="ds-container flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md overflow-hidden shadow-sm">
        <CardHeader className="space-y-2 bg-gradient-to-r from-copper/10 to-power/10">
          <div className="flex items-center justify-between">
            <Logo />
            <Badge variant="outline" className="bg-background/60">
              Provider
            </Badge>
          </div>
          <CardTitle className="text-xl">Continue with Google</CardTitle>
          <div lang="ar" dir="rtl" className="text-sm text-muted-foreground">
            تسجيل الدخول هنا مخصص لمقدّمي الخدمات فقط وباستخدام Google.
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-copper to-power text-snow hover:opacity-90"
            onClick={doGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue with Google
          </Button>

          <div className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground">
            <div lang="ar" dir="rtl">
              إذا كنت طالبًا أو تبحث عن خدمة، استخدم صفحة تسجيل دخول المستخدمين. هذه الصفحة خاصة بمقدّمي الخدمات فقط.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
