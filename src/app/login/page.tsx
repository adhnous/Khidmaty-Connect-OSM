'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { signUp, signIn, resetPassword, sendVerificationEmail, signInWithGoogle, signInAnonymously } from '@/lib/auth';
import { getUserProfile, createUserProfile, UserProfile, UserRole } from '@/lib/user';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getClientLocale, tr } from '@/lib/i18n';

const signUpSchema = z.object({
  email: z.string().email('عنوان البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'),
  role: z.enum(['seeker', 'provider'], {
    required_error: 'يرجى اختيار الدور',
  }),
});

const signInSchema = z.object({
  email: z.string().email('عنوان البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [resetting, setResetting] = useState(false);
  const locale = getClientLocale();

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', role: 'seeker' },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleRedirect = async (user: User) => {
    try {
      let userProfile: UserProfile | null = await getUserProfile(user.uid);
      if (!userProfile) {
        try {
          await createUserProfile(user.uid, user.email || '', 'seeker');
        } catch {}
        for (let i = 0; i < 5; i++) {
          userProfile = await getUserProfile(user.uid);
          if (userProfile) break;
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }

      if (userProfile?.role === 'provider') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Redirect failed:', error);
      toast({
        variant: 'destructive',
        title: 'Redirect failed',
        description: 'Could not retrieve user profile for redirection.',
      });
      router.push('/');
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const userCredential = await signUp(data.email, data.password);
      if (userCredential.user) {
        await createUserProfile(userCredential.user.uid, data.email, data.role as UserRole);
        // Send email verification and redirect to verify page
        await sendVerificationEmail(userCredential.user);
        toast({
          title: tr(locale, 'login.toasts.verifyEmailSentTitle'),
          description: tr(locale, 'login.toasts.verifyEmailSentDesc'),
        });
        toast({
          title: tr(locale, 'login.toasts.pleaseVerifyTitle'),
          description: tr(locale, 'login.toasts.pleaseVerifyDesc'),
        });
        router.push('/verify');
      }
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        setActiveTab('signin');
        // Pre-fill the email on the sign-in form
        signInForm.setValue('email', data.email, { shouldValidate: true });
        toast({
          variant: 'destructive',
          title: tr(locale, 'login.toasts.emailInUseTitle'),
          description: tr(locale, 'login.toasts.emailInUseDesc'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: tr(locale, 'login.toasts.signUpFailedTitle'),
          description: error?.message || tr(locale, 'login.toasts.signUpFailedDesc'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);
    try {
      const userCredential = await signIn(data.email, data.password);
      if (!userCredential.user.emailVerified) {
        toast({
          variant: 'destructive',
          title: tr(locale, 'login.toasts.pleaseVerifyTitle'),
          description: tr(locale, 'login.toasts.pleaseVerifyDesc'),
        });
        router.push('/verify');
        return;
      }
      toast({
        title: tr(locale, 'login.toasts.signedInTitle'),
        description: tr(locale, 'login.toasts.signedInDesc'),
      });
      await handleRedirect(userCredential.user);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: tr(locale, 'login.tabs.signin'),
        description: error?.message || tr(locale, 'login.toasts.signUpFailedDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const doGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      await handleRedirect(userCredential.user);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: tr(locale, 'login.toasts.googleSignInFailedTitle'),
        description: error?.message || tr(locale, 'login.toasts.googleSignInFailedDesc'),
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const doGuestSignIn = async () => {
    setGuestLoading(true);
    try {
      const userCredential = await signInAnonymously();
      await handleRedirect(userCredential.user);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: tr(locale, 'login.toasts.guestSignInFailedTitle'),
        description: error?.message || tr(locale, 'login.toasts.guestSignInFailedDesc'),
      });
    } finally {
      setGuestLoading(false);
    }
  };

  const isSigningIn = loading && activeTab === 'signin';
  const isSigningUp = loading && activeTab === 'signup';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tr(locale, 'login.welcome')}</CardTitle>
          <CardDescription>
            {tr(locale, 'login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{tr(locale, 'login.tabs.signin')}</TabsTrigger>
              <TabsTrigger value="signup">{tr(locale, 'login.tabs.signup')}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Form {...signInForm}>
                <form
                  onSubmit={signInForm.handleSubmit(handleSignIn)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'login.fields.email')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={tr(locale, 'login.fields.email')}
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'login.fields.password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={tr(locale, 'login.fields.password')}
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0"
                      onClick={async () => {
                        const email = signInForm.getValues('email');
                        if (!email) {
                          toast({
                            variant: 'destructive',
                            title: tr(locale, 'login.toasts.emailRequiredTitle'),
                            description: tr(locale, 'login.toasts.emailRequiredDesc'),
                          });
                          return;
                        }
                        try {
                          setResetting(true);
                          await resetPassword(email);
                          toast({
                            title: tr(locale, 'login.toasts.resetSentTitle'),
                            description: tr(locale, 'login.toasts.resetSentDesc'),
                          });
                        } catch (err: any) {
                          toast({
                            variant: 'destructive',
                            title: tr(locale, 'login.toasts.resetFailedTitle'),
                            description: err?.message || tr(locale, 'login.toasts.resetFailedDesc'),
                          });
                        } finally {
                          setResetting(false);
                        }
                      }}
                      disabled={loading || resetting}
                    >
                      {tr(locale, 'login.actions.forgot')}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {isSigningIn && <Loader2 className="mr-2 animate-spin" />}
                    {tr(locale, 'login.actions.signIn')}
                  </Button>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Button type="button" variant="outline" onClick={doGoogleSignIn} disabled={googleLoading}>
                      {googleLoading && <Loader2 className="mr-2 animate-spin" />}
                      تسجيل الدخول باستخدام Google
                    </Button>
                    <Button type="button" variant="secondary" onClick={doGuestSignIn} disabled={guestLoading}>
                      {guestLoading && <Loader2 className="mr-2 animate-spin" />}
                      الدخول كضيف
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'login.fields.email')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={tr(locale, 'login.fields.email')}
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'login.fields.password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={tr(locale, 'login.fields.password')}
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{tr(locale, 'login.fields.roleLabel')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            disabled={loading}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="seeker" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {tr(locale, 'login.fields.roleSeeker')}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="provider" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {tr(locale, 'login.fields.roleProvider')}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {isSigningUp && <Loader2 className="mr-2 animate-spin" />}
                    {tr(locale, 'login.actions.signUp')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
