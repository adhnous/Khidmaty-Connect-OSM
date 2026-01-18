"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getClientLocale, tr } from "@/lib/i18n";
import { getFeatures } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut,
  Globe,
  User as UserIcon,
  Menu,
  Bell,
  Shield,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = {
  href: string;
  label: string;
};

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getClientLocale();
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showCityViews, setShowCityViews] = useState(true);

  const role = userProfile?.role || null;
  const isOwner = role === "owner";
  const isProviderLike =
    role === "provider" || role === "admin" || role === "owner";

  // Subscribe to unread conversations count
  useEffect(() => {
    try {
      if (!user?.uid) {
        setUnread(0);
        return;
      }
      const field = `participants.${user.uid}` as any;
      const ref = collection(db, "conversations");
      const q = query(ref, where(field, "==", true));
      const unsub = onSnapshot(
        q,
        (snap) => {
          let count = 0;
          snap.forEach((d) => {
            const data: any = d.data();
            const lma =
              data?.lastMessageAt?.toMillis?.() ??
              (data?.lastMessageAt ? Date.parse(data.lastMessageAt) : 0);
            const lra =
              data?.participantsMeta?.[user.uid]?.lastReadAt?.toMillis?.() ??
              (data?.participantsMeta?.[user.uid]?.lastReadAt
                ? Date.parse(data.participantsMeta[user.uid].lastReadAt)
                : 0);
            if (lma && (!lra || lma > lra)) count++;
          });
          setUnread(count);
        },
        (error) => {
          console.warn("[TopNav] unread snapshot error:", error);
          setUnread(0);
        }
      );
      return () => {
        try {
          unsub();
        } catch {
          // ignore
        }
      };
    } catch {
      setUnread(0);
    }
  }, [user?.uid]);

  // Feature flags (e.g. showCityViews)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const f = await getFeatures();
        if (!cancelled) setShowCityViews(f?.showCityViews !== false);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live updates for feature flags
  useEffect(() => {
    try {
      const ref = doc(db, "settings", "features");
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const data: any = snap.data() || {};
          setShowCityViews(data?.showCityViews !== false);
        },
        (error) => {
          console.warn("[TopNav] features snapshot error:", error);
        }
      );
      return () => {
        try {
          unsub();
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }, []);

  const links: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];

    items.push({
      href: "/services",
      label: tr(locale, "header.browse", "Browse Services"),
    });

    if (showCityViews) {
      items.push({
        href: "/city-views",
        label: locale === "ar" ? "مناظر المدن" : "City Views",
      });
    }

    items.push({
      href: "/sales",
      label: locale === "ar" ? "البيع والتجارة" : "Sales & Trade",
    });

    if (isProviderLike) {
      items.push({
        href: "/dashboard",
        label: tr(locale, "header.providerDashboard", "Provider Dashboard"),
      });

      // OWNER‑ONLY items
      if (isOwner) {
        items.push(
          {
            href: "/dashboard/services",
            label: tr(locale, "header.myServices", "My Services"),
          },
          {
            href: "/add",
            label: tr(
              locale,
              "header.addService",
              "Add service or sale item",
            ),
          },
        );
      }

      items.push({
        href: "/dashboard/settings",
        label: locale === "ar" ? "الإعدادات" : "Settings",
      });
    }

    return items;
  }, [locale, showCityViews, isProviderLike, isOwner]);

  const changeLocale = async () => {
    try {
      const next = locale === "ar" ? "en" : "ar";
      if (typeof document !== "undefined") {
        document.cookie = `locale=${next}; path=/; max-age=31536000`;
      }
      router.refresh();
    } catch {
      // ignore
    }
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
        top: "calc(var(--ad-height) + env(safe-area-inset-top))",
        height: "var(--navH, 56px)",
      }}
      role="navigation"
      aria-label={locale === "ar" ? "التنقل العلوي" : "Top navigation"}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Brand on the right (RTL) */}
        <Link
          href="/"
          className="flex items-center gap-2 max-w-[40vw] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={locale === "ar" ? "الصفحة الرئيسية" : "Home"}
        >
          <div className="relative h-8 w-8 text-orange-400">
            <Shield className="h-8 w-8" />
            <Handshake className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="font-bold tracking-wide truncate text-orange-400">
            Khidmaty
          </div>
        </Link>

        {/* Primary nav links (hidden on mobile) */}
        <nav className="hidden md:flex flex-1 items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "rounded px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[44px]",
                isActive(l.href) && "bg-white/15 font-medium",
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
              onClick={() => router.push("/messages")}
              className="relative text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]"
              title={locale === "ar" ? "الرسائل" : "Messages"}
              aria-label={locale === "ar" ? "الرسائل" : "Messages"}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] font-bold leading-[18px] text-white">
                  {unread > 99 ? "99+" : unread}
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
            <span className="ms-2 hidden text-xs font-medium sm:inline">
              {locale === "ar" ? "EN" : "AR"}
            </span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-white/20">
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="ms-2 hidden text-xs sm:inline">
                    {user?.email ?? tr(locale, "header.profile", "Account")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {isProviderLike ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        {tr(locale, "header.profile", "Profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        {tr(
                          locale,
                          "header.providerDashboard",
                          "Provider Dashboard",
                        )}
                      </Link>
                    </DropdownMenuItem>
                    {isOwner && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/services">
                            {tr(locale, "header.myServices", "My Services")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/add">
                            {tr(
                              locale,
                              "header.addService",
                              "Add service or sale item",
                            )}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        {locale === "ar" ? "الإعدادات" : "Settings"}
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      {tr(locale, "header.profile", "Profile")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="text-red-500"
                >
                  <LogOut className="me-2 h-4 w-4" />{" "}
                  {tr(locale, "header.signOut", "Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black min-h-[44px]"
              >
                <UserIcon className="h-4 w-4" />
                <span className="ms-2 hidden text-xs sm:inline">
                  {tr(locale, "header.login", "Login")}
                </span>
              </Button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10 min-h-[44px]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 sm:w-80"
              aria-label={locale === "ar" ? "القائمة" : "Menu"}
            >
              <SheetHeader>
                <SheetTitle>
                  {locale === "ar" ? "القائمة" : "Menu"}
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1 mt-4">
                <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
                  {locale === "ar" ? "تصفح" : "Browse"}
                </div>

                {links
                  // hide provider-only links from the mobile sheet
                  .filter(
                    (l) =>
                      !l.href.startsWith("/dashboard") && l.href !== "/create",
                  )
                  .map((l) => (
                    <Link
                      key={`m-${l.href}`}
                      href={l.href}
                      className={cx(
                        "rounded ps-3 pe-3 h-11 inline-flex items-center text-sm hover:bg-accent/10",
                        isActive(l.href) && "bg-accent/10 font-medium",
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}

                <div className="mt-3 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={changeLocale}
                    className="rounded ps-3 pe-3 h-11 inline-flex items-center text-sm hover:bg-accent/10 w-full text-left"
                  >
                    {tr(locale, "header.switch", "Switch language")}
                  </button>
                  {!user && (
                    <Link
                      href="/login"
                      className="mt-1 rounded ps-3 pe-3 h-11 inline-flex items-center text-sm hover:bg-accent/10 w-full"
                    >
                      {tr(locale, "header.login", "Login")}
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
