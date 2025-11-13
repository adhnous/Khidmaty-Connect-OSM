"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getClientLocale } from "@/lib/i18n";
import { getFeatures } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Globe, User as UserIcon, Menu, Bell, Shield, Handshake } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { getFcmToken, saveFcmToken } from "@/lib/messaging";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getClientLocale();
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [notifLoading, setNotifLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showCityViews, setShowCityViews] = useState(true);

  const enableNotifications = async () => {
    if (!user) return;
    try {
      setNotifLoading(true);
      const token = await getFcmToken();
      if (!token) {
        const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        toast({
          variant: 'destructive',
          title: (getClientLocale() === 'ar' ? 'لم يتم تفعيل الإشعارات' : 'Notifications not enabled'),
          description: granted
            ? (getClientLocale() === 'ar' ? 'مشكلة إعدادات على الخادم.' : 'Server configuration issue (VAPID).')
            : (getClientLocale() === 'ar' ? 'تم رفض الإذن أو غير مدعوم.' : 'Permission denied or unsupported.')
        });
        return;
      }
      await saveFcmToken(user.uid, token);
      toast({
        title: (getClientLocale() === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled'),
        description: (getClientLocale() === 'ar' ? 'ستتلقى تنبيهات عند وجود نشاط جديد.' : 'You will receive alerts for new activity.')
      });
    } catch {
      toast({ variant: 'destructive', title: (getClientLocale() === 'ar' ? 'فشل التفعيل' : 'Enable failed') });
    } finally {
      setNotifLoading(false);
    }
  };

  // Subscribe to unread conversations count
  useEffect(() => {
    try {
      if (!user?.uid) { setUnread(0); return; }
      const field = `participants.${user.uid}` as any;
      const ref = collection(db, 'conversations');
      const q = query(ref, where(field, '==', true));
      const unsub = onSnapshot(q, (snap) => {
        let count = 0;
        snap.forEach((d) => {
          const data: any = d.data();
          const lma = data?.lastMessageAt?.toMillis?.() ?? (data?.lastMessageAt ? Date.parse(data.lastMessageAt) : 0);
          const lra = data?.participantsMeta?.[user.uid]?.lastReadAt?.toMillis?.() ?? (data?.participantsMeta?.[user.uid]?.lastReadAt ? Date.parse(data.participantsMeta[user.uid].lastReadAt) : 0);
          if (lma && (!lra || lma > lra)) count++;
        });
        setUnread(count);
      });
      return () => { try { unsub(); } catch {} };
    } catch { setUnread(0); }
  }, [user?.uid]);

  const links = useMemo(() => {
    const items = [
      { href: "/", label: locale === "ar" ? "تصفح الخدمات" : "Browse Services" },
    ];
    if (showCityViews) {
      items.push({ href: "/city-views", label: locale === "ar" ? "مشاهد المدن" : "City Views" });
    }
    // Expose Sales feed in primary navigation
    items.push({ href: "/sales", label: locale === "ar" ? "البيع والتجارة" : "Sales & Trade" });
    const role = userProfile?.role;
    const canSeeProvider = role === 'provider' || role === 'admin' || role === 'owner';
    if (canSeeProvider) {
      items.push(
        { href: "/dashboard", label: locale === "ar" ? "لوحة المزود" : "Provider Dashboard" },
        { href: "/dashboard/services", label: locale === "ar" ? "إعلاناتي" : "My Services" },
        { href: "/create", label: locale === "ar" ? "إضافة خدمة أو عنصر للبيع" : "Add Service" },

        { href: "/dashboard/settings", label: locale === "ar" ? "الإعدادات" : "Settings" },
      );
    }
    return items;
  }, [locale, userProfile?.role, showCityViews]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const f = await getFeatures();
        if (!cancelled) setShowCityViews(f?.showCityViews !== false);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const ref = doc(db, 'settings', 'features');
      const unsub = onSnapshot(ref, (snap) => {
        const data: any = snap.data() || {};
        setShowCityViews(data?.showCityViews !== false);
      });
      return () => { try { unsub(); } catch {} };
    } catch {}
  }, []);

  const changeLocale = async () => {
    try {
      const next = locale === "ar" ? "en" : "ar";
      if (typeof document !== "undefined") {
        document.cookie = `locale=${next}; path=/; max-age=31536000`;
      }
      router.refresh();
    } catch {}
  };

  const onSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (e) {
      console.error("signOut failed", e);
    }
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      id="top-nav"
      className="fixed inset-x-0 z-[100] bg-black text-white border-b border-white/10"
      style={{
        top: 'calc(var(--ad-height) + env(safe-area-inset-top))',
        height: 'var(--navH, 56px)'
      }}
      role="navigation"
      aria-label={locale === 'ar' ? 'شريط التنقل' : 'Top navigation'}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Brand on the right (RTL) */}
        <Link
          href="/"
          className="flex items-center gap-2 max-w-[40vw] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={locale === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
        >
          <div className="relative h-8 w-8 text-orange-400">
            <Shield className="h-8 w-8" />
            <Handshake className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="font-bold tracking-wide truncate text-orange-400">Khidmaty · خدمتي</div>
        </Link>

        {/* Primary nav links (hidden on mobile) */}
        <nav className="hidden md:flex flex-1 items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "rounded px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]",
                isActive(l.href) && "bg-white/15 font-medium"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions: language + user menu + mobile hamburger */}
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/messages')}
              className="relative text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]"
              title={locale === 'ar' ? 'الرسائل' : 'Messages'}
              aria-label={locale === 'ar' ? 'الرسائل' : 'Messages'}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] font-bold leading-[18px] text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={changeLocale}
            className="text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]"
            title={locale === "ar" ? "English" : "العربية"}
          >
            <Globe className="h-4 w-4" />
            <span className="ms-2 hidden text-xs font-medium sm:inline">{locale === "ar" ? "EN" : "AR"}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-white/20">
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="ms-2 hidden text-xs sm:inline">{user?.email ?? (locale === "ar" ? "الحساب" : "Account")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {userProfile?.role === 'provider' || userProfile?.role === 'admin' || userProfile?.role === 'owner' ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">{locale === "ar" ? "الملف الشخصي" : "Profile"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">{locale === "ar" ? "لوحة المزود" : "Provider Dashboard"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/services">{locale === "ar" ? "إعلاناتي" : "My Services"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/create">{locale === "ar" ? "إضافة خدمة أو عنصر للبيع" : "Add Service"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">{locale === "ar" ? "الإعدادات" : "Settings"}</Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">{locale === "ar" ? "الملف الشخصي" : "Profile"}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSignOut} className="text-red-500">
                  <LogOut className="me-2 h-4 w-4" /> {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]">
                <UserIcon className="h-4 w-4" />
                <span className="ms-2 hidden text-xs sm:inline">{locale === "ar" ? "تسجيل الدخول" : "Login"}</span>
              </Button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10 min-h-[44px]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 sm:w-80" aria-label={locale === "ar" ? "القائمة" : "Menu"}>
              <SheetHeader>
                <SheetTitle>{locale === "ar" ? "القائمة" : "Menu"}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-4">
                {links.map((l) => (
                  <Link
                    key={`m-${l.href}`}
                    href={l.href}
                    className={cx(
                      "rounded ps-3 pe-3 h-12 inline-flex items-center text-sm hover:bg-accent/10",
                      isActive(l.href) && "bg-accent/10 font-medium"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={changeLocale}
                  className="rounded ps-3 pe-3 h-12 inline-flex items-center text-sm hover:bg-accent/10"
                >
                  {locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                </button>
                {user ? (
                  <>
                    <Link href="/dashboard/profile" className="rounded ps-3 pe-3 h-12 inline-flex items-center text-sm hover:bg-accent/10">
                      {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </Link>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="rounded ps-3 pe-3 h-12 inline-flex items-center text-sm text-red-600 hover:bg-red-50"
                    >
                      {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="rounded ps-3 pe-3 h-12 inline-flex items-center text-sm hover:bg-accent/10">
                    {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
