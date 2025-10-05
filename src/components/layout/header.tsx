
'use client';

import { LogIn, User, LogOut, Briefcase, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { getFcmToken, saveFcmToken } from '@/lib/messaging';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function Header() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [locale, setLocale] = useState<'en' | 'ar'>(() => {
    try {
      if (typeof document === 'undefined') return 'en';
      const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      return lang.startsWith('ar') ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'There was an error signing out.',
      });
    }
  };

  const getInitials = (email: string | null | undefined) => {
    return email ? email.substring(0, 2).toUpperCase() : 'AC';
  }

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )locale=([^;]+)/);
      const fromCookie = (match?.[1] || '').toLowerCase();
      const fromHtml = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      const l = (fromCookie || fromHtml).startsWith('ar') ? 'ar' : 'en';
      setLocale(l);
    } catch {}
  }, []);

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    // Apply immediately for a smoother feel, then reload to re-render server side
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    window.location.reload();
  };

  const [notifLoading, setNotifLoading] = useState(false);
  const enableNotifications = async () => {
    if (!user) return;
    try {
      setNotifLoading(true);
      const token = await getFcmToken();
      if (!token) {
        const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        const description = granted
          ? 'Missing or invalid Web Push VAPID key. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY to the PUBLIC key from Firebase Console.'
          : 'Permission denied or unsupported.';
        toast({ variant: 'destructive', title: 'Notifications not enabled', description });
        return;
      }
      await saveFcmToken(user.uid, token);
      toast({ title: 'Notifications enabled', description: 'You will receive alerts for new activity.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Enable failed', description: 'Could not enable notifications.' });
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b brand-gradient text-white">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" asChild>
              <Link href="/">{tr(locale, 'header.browse')}</Link>
            </Button>
            { userProfile?.role === 'provider' && (
              <Button variant="ghost" className="text-white hover:bg-white/10 font-medium" asChild>
                <Link href="/dashboard">{tr(locale, 'header.providerDashboard')}</Link>
              </Button>
            )}
          </nav>
          {user && userProfile?.role === 'provider' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-white hover:bg-white/10 border-0"
              onClick={enableNotifications}
              disabled={notifLoading}
              title="Enable notifications"
              aria-label="Enable notifications"
            >
              <Bell className="mr-1 h-4 w-4" />
              Notifications
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 rounded-full bg-white px-3 text-primary hover:bg-white/90 border-0 shadow-sm"
            onClick={toggleLocale}
            title={tr(locale, 'header.switch')}
            aria-label={tr(locale, 'header.switch')}
          >
            {locale === 'ar' ? 'EN' : 'AR'}
          </Button>
          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full text-primary-foreground">
                  <Avatar className="h-9 w-9 ring-1 ring-white/30">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback className="bg-white text-primary font-semibold">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName ?? 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {userProfile?.role === 'provider' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <Briefcase className="mr-2" />
                      {tr(locale, 'header.providerDashboard')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {userProfile?.role === 'provider' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/services">
                        <Briefcase className="mr-2" />
                        {tr(locale, 'header.myServices')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/services/new">
                        <Briefcase className="mr-2" />
                        {tr(locale, 'header.addService')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2" />
                    {tr(locale, 'header.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2" />
                  {tr(locale, 'header.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                {tr(locale, 'header.login')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
