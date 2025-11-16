"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Briefcase, User, LogIn, Tag, PlusCircle } from "lucide-react";
import { tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { getFeatures } from "@/lib/settings";

export default function BottomNav() {
  const { user, userProfile } = useAuth();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [showPricing, setShowPricing] = useState(false);
  const [showCityViews, setShowCityViews] = useState(true);
  const navRef = useRef<HTMLElement | null>(null);

  // Set locale from document
  useEffect(() => {
    try {
      const fromHtml = document.documentElement.getAttribute("lang") || "en";
      setLocale(fromHtml.toLowerCase().startsWith("ar") ? "ar" : "en");
    } catch (error) {
      console.error("Error setting locale:", error);
      setLocale("en");
    }
  }, []);

  // Expose BottomNav height to CSS var
  useEffect(() => {
    const updateVar = () => {
      try {
        const h = navRef.current?.offsetHeight ?? 0;
        document.documentElement.style.setProperty(
          "--bottom-nav-height",
          `${h}px`,
        );
      } catch {}
    };
    updateVar();
    window.addEventListener("resize", updateVar);
    return () => window.removeEventListener("resize", updateVar);
  }, []);

  // Handle pricing visibility
  useEffect(() => {
    let isMounted = true;

    const checkPricingVisibility = async () => {
      try {
        // Check for URL parameters or cookies that hide pricing
        const urlHide =
          searchParams?.get("hidePricing") || searchParams?.get("noPricing");
        const cookieHide =
          typeof document !== "undefined"
            ? document.cookie.includes("hidePricing=1")
            : false;

        if (urlHide) {
          // Set cookie if URL parameter is present
          try {
            document.cookie = "hidePricing=1; path=/; max-age=86400";
          } catch (cookieError) {
            console.warn("Could not set cookie:", cookieError);
          }
          if (isMounted) setShowPricing(false);
          return;
        }

        if (cookieHide) {
          if (isMounted) setShowPricing(false);
          return;
        }

        // Check features and user settings
        const features = await getFeatures();
        if (!isMounted) return;

        const pricingGate = userProfile?.pricingGate || {};
        const forcedShow = pricingGate.mode === "force_show";

        if (isMounted) {
          setShowPricing(!!forcedShow);
          setShowCityViews(features?.showCityViews !== false);
        }
      } catch (error) {
        console.error("Error checking pricing visibility:", error);
        if (isMounted) setShowPricing(false);
      }
    };

    checkPricingVisibility();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, userProfile, searchParams]);

  // Calculate active state for navigation items
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Bottom navigation items: services, sales, home, add (provider), profile/login
  const navItems = useMemo(() => {
    type Item = {
      href: string;
      icon: any;
      label: string;
      active: boolean;
      enabled: boolean;
    };
    const items: Item[] = [];

    // 1) Browse services
    items.push({
      href: "/services",
      icon: Briefcase,
      label: locale === "ar" ? "الخدمات" : "Services",
      active: isActive("/services"),
      enabled: true,
    });

    // 2) Browse sales
    items.push({
      href: "/sales",
      icon: Tag,
      label: locale === "ar" ? "البيع والتجارة" : "Sales",
      active: isActive("/sales"),
      enabled: true,
    });

    // 3) Home / landing page
    items.push({
      href: "/",
      icon: Home,
      label: locale === "ar" ? "الرئيسية" : "Home",
      active: isActive("/"),
      enabled: true,
    });

    // 4) Add service or sale (provider only) -> goes to /add cards
    if (user && userProfile?.role === "provider") {
      items.push({
        href: "/add",
        icon: PlusCircle,
        label:
          locale === "ar"
            ? "إضافة خدمة أو عنصر للبيع"
            : "Add service or sale",
        active: isActive("/add"),
        enabled: true,
      });
    }

    // 5) Profile or Login
    items.push({
      href: user ? "/dashboard/profile" : "/login",
      icon: user ? User : LogIn,
      label: tr(locale, user ? "header.profile" : "header.login"),
      active: user ? isActive("/dashboard/profile") : isActive("/login"),
      enabled: true,
    });

    return items;
  }, [locale, user, userProfile, pathname]);

  // Don't render on larger screens
  return (
    <nav
      ref={navRef as any}
      className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden pb-safe"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isItemActive = item.active;

          const baseClasses =
            "flex flex-col items-center justify-center py-2 text-sm flex-1 min-w-0 px-1";
          const activeClasses = isItemActive ? "text-primary font-semibold" : "";

          const content = (
            <>
              <Icon
                className={`h-5 w-5 ${
                  isItemActive ? "text-primary" : ""
                }`}
              />
              <span
                className={`mt-1 max-w-full truncate text-xs ${activeClasses}`}
              >
                {item.label}
              </span>
            </>
          );

          if (item.enabled) {
            return (
              <Link
                key={index}
                href={item.href}
                className={baseClasses}
                aria-current={isItemActive ? "page" : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <span
              key={index}
              className={`${baseClasses} cursor-not-allowed opacity-50`}
              title={locale === "ar" ? "غير متاح" : "Not available"}
            >
              {content}
            </span>
          );
        })}
      </div>
    </nav>
  );
}

