'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  linkWithCredential,
  type User,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getGoogleRedirectResult,
  resetPassword,
  sendVerificationEmail,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signIn,
  signUp,
} from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/user';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const PENDING_GOOGLE_EMAIL_KEY = 'khidmaty:pendingGoogleEmail';
const PENDING_GOOGLE_CRED_KEY = 'khidmaty:pendingGoogleCred';
const GOOGLE_REDIRECT_MARKER_KEY = 'khidmaty:googleRedirectStartedAt';

async function waitForAuthUser(timeoutMs = 2500): Promise<User | null> {
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(u);
      },
      () => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(null);
      }
    );

    setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        unsubscribe();
      } catch {
        // ignore
      }
      resolve(auth.currentUser);
    }, timeoutMs);
  });
}

async function ensureProviderProfile(user: User): Promise<UserProfile | null> {
  const isProviderLike = (profile: UserProfile | null) =>
    !!profile &&
    (profile.role === 'provider' ||
      profile.role === 'admin' ||
      profile.role === 'owner');

  const readWithRetries = async (tries: number) => {
    for (let i = 0; i < tries; i++) {
      const p = await getUserProfile(user.uid);
      if (p) return p;
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  };

  // Fast path: profile exists and is already provider-like.
  let profile = await getUserProfile(user.uid);
  if (isProviderLike(profile)) return profile;

  // If no profile doc yet, try creating it on the client first (no server creds needed).
  if (!profile) {
    try {
      await updateUserProfile(
        user.uid,
        {
          role: 'provider',
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        },
        { authEmail: user.email || null }
      );
    } catch {
      // ignore; may still be created by server or by another device
    }

    profile = await readWithRetries(5);
    if (isProviderLike(profile)) return profile;
  }

  // Fix/migrate on the server (also promotes seeker -> provider).
  try {
    const token = await user.getIdToken(true);
    const res = await fetch('/api/auth/ensure-provider', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) return profile;
    profile = await readWithRetries(5);
    return profile;
  } catch {
    return profile;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugAuth = searchParams.get('debugAuth') === '1';
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  const stashPendingGoogleCredential = (error: any) => {
    try {
      const pendingEmail = String((error?.customData as any)?.email || '').trim();
      const cred = GoogleAuthProvider.credentialFromError(error);
      if (!pendingEmail || !cred) return false;
      sessionStorage.setItem(PENDING_GOOGLE_EMAIL_KEY, pendingEmail);
      sessionStorage.setItem(PENDING_GOOGLE_CRED_KEY, JSON.stringify(cred.toJSON()));
      return true;
    } catch {
      return false;
    }
  };

  const maybeLinkPendingGoogleCredential = async (user: User) => {
    try {
      const raw = sessionStorage.getItem(PENDING_GOOGLE_CRED_KEY);
      if (!raw) return;
      const pendingEmail = (sessionStorage.getItem(PENDING_GOOGLE_EMAIL_KEY) || '').trim();
      const currentEmail = (user.email || '').trim();
      if (pendingEmail && currentEmail && pendingEmail !== currentEmail) return;

      const json = JSON.parse(raw);
      const cred = OAuthProvider.credentialFromJSON(json as any);
      await linkWithCredential(user, cred);
      sessionStorage.removeItem(PENDING_GOOGLE_EMAIL_KEY);
      sessionStorage.removeItem(PENDING_GOOGLE_CRED_KEY);
      toast({
        title: 'Google linked',
        description: 'You can sign in with Google next time.',
      });
    } catch (e: any) {
      const code = String(e?.code || '');
      if (code === 'auth/provider-already-linked') {
        sessionStorage.removeItem(PENDING_GOOGLE_EMAIL_KEY);
        sessionStorage.removeItem(PENDING_GOOGLE_CRED_KEY);
        return;
      }
      sessionStorage.removeItem(PENDING_GOOGLE_EMAIL_KEY);
      sessionStorage.removeItem(PENDING_GOOGLE_CRED_KEY);
      toast({
        variant: 'destructive',
        title: 'Could not link Google',
        description: e?.message || 'Please try signing in with Google again.',
      });
    }
  };

  const handleSignedInUser = useCallback(
    async (user: User) => {
      const profile = await ensureProviderProfile(user);
      if (!profile) {
        setAuthError('Profile not ready (missing/invalid users/{uid} doc)');
        toast({
          variant: 'destructive',
          title: 'Profile not ready',
          description: 'Could not load your profile. Please try again.',
        });
        return;
      }

      const role = profile.role;
      const allowed = role === 'provider' || role === 'admin' || role === 'owner';
      if (!allowed) {
        setAuthError(`Access denied (role=${String(role)})`);
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'This login is for service providers only.',
        });
        return;
      }

      if (!user.isAnonymous && !user.emailVerified) {
        setAuthError(null);
        router.replace('/verify');
        return;
      }

      setAuthError(null);
      router.replace('/dashboard');
    },
    [router, toast]
  );

  // If we returned from Google redirect login, consume the redirect result.
  // Also auto-redirect signed-in users away from /login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let expectedRedirect = false;
      try {
        expectedRedirect = !!sessionStorage.getItem(GOOGLE_REDIRECT_MARKER_KEY);
      } catch {
        expectedRedirect = false;
      }
      try {
        setGoogleLoading(true);
        let result: any = null;
        try {
          result = await getGoogleRedirectResult();
        } catch (error: any) {
          const code = String(error?.code || '');
          if (code && code !== 'auth/no-auth-event') throw error;
        }

        let u = result?.user ?? auth.currentUser;
        if (!u) {
          u = await waitForAuthUser(2500);
        }

        if (cancelled) return;

        if (!u) {
          if (expectedRedirect) {
            setAuthError(
              'Google sign-in did not complete. Please try again. If this keeps happening, check Firebase Auth -> Settings -> Authorized domains and allow cookies/storage for this site.'
            );
            toast({
              variant: 'destructive',
              title: 'Google sign-in did not complete',
              description: 'No user was returned from the redirect.',
            });
          }
          return;
        }

        setAuthError(null);
        await handleSignedInUser(u);
      } catch (error: any) {
        if (cancelled) return;

        const code = String(error?.code || '');

        if (code === 'auth/account-exists-with-different-credential') {
          const pendingEmail = String((error?.customData as any)?.email || '').trim();
          const stashed = stashPendingGoogleCredential(error);
          setTab('signin');
          if (pendingEmail) setEmail(pendingEmail);
          setAuthError(code);
          toast({
            variant: 'destructive',
            title: 'Email already has an account',
            description: stashed
              ? 'Sign in with email/password to link Google automatically.'
              : 'Sign in with email/password, then link Google from your profile.',
          });
          return;
        }

        setAuthError(code || error?.message || 'Google sign-in failed');
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: code
            ? `${code}: ${error?.message || 'Could not complete Google sign-in.'}`
            : error?.message || 'Could not complete Google sign-in.',
        });
      } finally {
        try {
          sessionStorage.removeItem(GOOGLE_REDIRECT_MARKER_KEY);
        } catch {
          // ignore
        }
        if (!cancelled) setGoogleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleSignedInUser, toast]);

  useEffect(() => {
    if (!debugAuth) return;

    const readDebug = () => {
      const u = auth.currentUser;
      let redirectMarker: string | null = null;
      let pendingGoogleEmail: string | null = null;
      let hasPendingGoogleCred = false;
      try {
        redirectMarker = sessionStorage.getItem(GOOGLE_REDIRECT_MARKER_KEY);
        pendingGoogleEmail = sessionStorage.getItem(PENDING_GOOGLE_EMAIL_KEY);
        hasPendingGoogleCred = !!sessionStorage.getItem(PENDING_GOOGLE_CRED_KEY);
      } catch {
        // ignore
      }

      setDebugInfo({
        href: typeof window !== 'undefined' ? window.location.href : null,
        firebase: {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        },
        currentUser: u
          ? {
              uid: u.uid,
              email: u.email,
              emailVerified: u.emailVerified,
              providers: u.providerData.map((p) => p.providerId),
            }
          : null,
        redirectMarker,
        pendingGoogleEmail,
        hasPendingGoogleCred,
        authError,
      });
    };

    readDebug();
    const unsub = onAuthStateChanged(auth, () => readDebug());
    return () => unsub();
  }, [debugAuth, authError]);

  const doGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      setAuthError(null);

      // Prefer a popup flow when available (more reliable than redirect in some environments).
      // Fall back to redirect when popups are blocked/unsupported.
      try {
        const result = await signInWithGoogle();
        await handleSignedInUser(result.user);
        return;
      } catch (popupError: any) {
        const popupCode = String(popupError?.code || '');
        if (
          popupCode === 'auth/popup-closed-by-user' ||
          popupCode === 'auth/cancelled-popup-request'
        ) {
          return;
        }

        if (
          popupCode !== 'auth/popup-blocked' &&
          popupCode !== 'auth/operation-not-supported-in-this-environment'
        ) {
          throw popupError;
        }
      }

      try {
        sessionStorage.setItem(GOOGLE_REDIRECT_MARKER_KEY, String(Date.now()));
      } catch {
        // ignore
      }
      toast({
        title: 'Redirecting to Google…',
        description: 'Choose an account to sign in / sign up.',
      });
      await signInWithGoogleRedirect();
    } catch (error: any) {
      try {
        sessionStorage.removeItem(GOOGLE_REDIRECT_MARKER_KEY);
      } catch {
        // ignore
      }
      const code = String(error?.code || '');

      if (code === 'auth/unauthorized-domain') {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError(code);
        toast({
          variant: 'destructive',
          title: 'Unauthorized domain',
          description: host
            ? `Add ${host} to Firebase Auth → Settings → Authorized domains.`
            : 'Add your site domain to Firebase Auth → Settings → Authorized domains.',
        });
        return;
      }

      if (code === 'auth/account-exists-with-different-credential') {
        const pendingEmail = String((error?.customData as any)?.email || '').trim();
        const stashed = stashPendingGoogleCredential(error);
        setTab('signin');
        if (pendingEmail) setEmail(pendingEmail);
        setAuthError(code);
        toast({
          variant: 'destructive',
          title: 'Email already has an account',
          description: stashed
            ? 'Sign in with email/password to link Google automatically.'
            : 'Sign in with email/password, then link Google from your profile.',
        });
        return;
      }

      setAuthError(code || error?.message || 'Google sign-in failed');
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: code
          ? `${code}: ${error?.message || 'Could not sign in with Google.'}`
          : error?.message || 'Could not sign in with Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const doEmailSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      setAuthError(null);
      const cred = await signIn(email.trim(), password);
      await maybeLinkPendingGoogleCredential(cred.user);
      await handleSignedInUser(cred.user);
    } catch (error: any) {
      const code = String(error?.code || '');
      setAuthError(code || error?.message || 'Email sign-in failed');
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: error?.message || 'Could not sign in with email.',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const doEmailSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 6) {
      setAuthError('Weak password');
      toast({
        variant: 'destructive',
        title: 'Weak password',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please re-type your password.',
      });
      return;
    }

    setEmailLoading(true);
    try {
      setAuthError(null);
      const cred = await signUp(email.trim(), password);
      await ensureProviderProfile(cred.user);
      await sendVerificationEmail(cred.user);
      toast({
        title: 'Account created',
        description: 'Check your email to verify your account.',
      });
      router.replace('/verify');
    } catch (error: any) {
      const code = String(error?.code || '');
      setAuthError(code || error?.message || 'Email sign-up failed');
      toast({
        variant: 'destructive',
        title: 'Sign-up failed',
        description: error?.message || 'Could not create account.',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const doResetPassword = async () => {
    const addr = email.trim();
    if (!addr) {
      setAuthError('Missing email');
      toast({
        variant: 'destructive',
        title: 'Missing email',
        description: 'Enter your email first, then click reset.',
      });
      return;
    }

    setResetLoading(true);
    try {
      setAuthError(null);
      await resetPassword(addr);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the reset link.',
      });
    } catch (error: any) {
      const code = String(error?.code || '');
      setAuthError(code || error?.message || 'Reset failed');
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: error?.message || 'Could not send reset email.',
      });
    } finally {
      setResetLoading(false);
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

          {authError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {authError}
            </div>
          )}

          {debugAuth && (
            <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-2 text-[10px] leading-relaxed">
              {debugInfo ? JSON.stringify(debugInfo, null, 2) : 'Loading auth debug...'}
            </pre>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v === 'signup' ? 'signup' : 'signin')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Email sign in</TabsTrigger>
              <TabsTrigger value="signup">Email sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-3" onSubmit={doEmailSignIn}>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={emailLoading}>
                  {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={doResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Forgot password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-3" onSubmit={doEmailSignUp}>
                <div className="space-y-1">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={emailLoading}>
                  {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground">
            <div lang="ar" dir="rtl">
              إذا كنت طالبًا أو تبحث عن خدمة، استخدم صفحة تسجيل دخول المستخدمين. هذه الصفحة خاصة بمقدّمي الخدمات فقط.
            </div>
            <div className="mt-2">
              New here? Your account will be created automatically on first sign-in.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
