"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import SalesHero from "@/components/sales-hero";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { libyanCities } from "@/lib/cities";
import { getClientLocale, tr } from "@/lib/i18n";
import { listSaleItems, type SaleItem } from "@/lib/sale-items";
import SaleCard from "@/components/SaleCard";
import PromotedSaleStrip from "@/components/promoted-sale-strip";

type SaleCategory = {
  id: string;
  ar: string;
  en: string;
  icon: string;
};

const SALE_CATEGORIES: SaleCategory[] = [
  { id: "cars", ar: "سيارات ومركبات", en: "Cars & Vehicles", icon: "🚗" },
  { id: "realEstate", ar: "عقارات للبيع", en: "Property for Sale", icon: "🏠" },
  { id: "electronics", ar: "الكترونيات", en: "Electronics", icon: "📺" },
  { id: "mobile", ar: "موبايل - تابلت", en: "Mobiles & Tablets", icon: "📱" },
  { id: "home", ar: "المنزل والحديقة", en: "Home & Garden", icon: "🛋️" },
  { id: "fashion", ar: "أزياء وموضة", en: "Fashion", icon: "👗" },
];

const EXTRA_SALE_CATEGORIES: SaleCategory[] = [
  { id: "shops", ar: "متاجر", en: "Shops", icon: "🏬" },
  { id: "motorcycles", ar: "دراجات نارية", en: "Motorcycles", icon: "🏍️" },
  { id: "property-rent", ar: "عقارات للايجار", en: "Property for Rent", icon: "🏢" },
  { id: "jobs", ar: "وظائف", en: "Jobs", icon: "💼" },
  { id: "teaching", ar: "تدريس وتدريب", en: "Teaching & Training", icon: "🎓" },
  { id: "services", ar: "الخدمات", en: "Services", icon: "🛠️" },
  { id: "companies", ar: "شركات ومعدات", en: "Companies & Equipment", icon: "🏗️" },
  { id: "laptops", ar: "لابتوب وكمبيوتر", en: "Laptops & Computers", icon: "💻" },
  { id: "video-games", ar: "ألعاب الفيديو والأطفال", en: "Video Games & Kids", icon: "🎮" },
  { id: "sports", ar: "معدات رياضية ولياقة", en: "Sports & Fitness", icon: "🏃‍♂️" },
  { id: "kids-toys", ar: "لوازم الأطفال و الألعاب", en: "Kids & Toys", icon: "🧸" },
  { id: "fashion-men", ar: "أزياء - موضة رجالي", en: "Men's Fashion", icon: "👔" },
  { id: "fashion-women", ar: "أزياء - موضة نسائية", en: "Women's Fashion", icon: "👗" },
  { id: "pets", ar: "حيوانات واكسسوارات", en: "Pets & Accessories", icon: "🐾" },
  { id: "food", ar: "طعام - غذاء", en: "Food", icon: "🍔" },
  { id: "books-entertainment", ar: "ترفيه وكتب ومقتنيات", en: "Books & Entertainment", icon: "📚" },
];

const SALE_CATEGORIES_FOR_UI: SaleCategory[] = [
  ...SALE_CATEGORIES,
  ...EXTRA_SALE_CATEGORIES,
];

export default function SalesFeedPage() {
  const locale = getClientLocale();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>("ALL_CITIES");
  const [condition, setCondition] = useState<string>("ALL");
  const [trade, setTrade] = useState<boolean>(false);
  const [q, setQ] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showSearchCategories, setShowSearchCategories] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      let rows = await listSaleItems({
        city: city === "ALL_CITIES" ? undefined : city,
        condition: condition === "ALL" ? undefined : (condition as any),
        tradeEnabled: trade ? true : undefined,
        sort: "newest",
        take: 60,
      });

      // client-side query filter (title, description, tags, tradeFor, city)
      const needle = q.trim().toLowerCase();
      if (needle) {
        rows = rows.filter((r: any) => {
          const t = String(r?.title || "").toLowerCase();
          const d = String(r?.description || "").toLowerCase();
          const tf = String(r?.trade?.tradeFor || "").toLowerCase();
          const c = String(r?.city || "").toLowerCase();
          const tags: string[] = Array.isArray(r?.tags)
            ? (r.tags as string[])
            : [];
          const inTags = tags.some((x) =>
            String(x || "").toLowerCase().includes(needle),
          );
          return (
            t.includes(needle) ||
            d.includes(needle) ||
            tf.includes(needle) ||
            c.includes(needle) ||
            inTags
          );
        });
      }

      if (activeCategory) {
        rows = rows.filter((r: any) =>
          matchesCategoryByText(r as SaleItem, activeCategory),
        );
      }

      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(cat: SaleCategory) {
    if (activeCategory === cat.id) {
      setActiveCategory(null);
      setQ("");
      return;
    }

    setActiveCategory(cat.id);
    setQ(locale === "ar" ? cat.ar : cat.en);

    // On mobile (and desktop), bring the results into view
    // so the user sees the matching ads immediately.
    setTimeout(() => {
      try {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // ignore scroll issues
      }
    }, 0);
  }

  function matchesCategory(item: SaleItem, categoryId: string): boolean {
    const textBase = `${item.title ?? ""} ${item.description ?? ""} ${
      Array.isArray(item.tags) ? item.tags.join(" ") : ""
    }`;
    const text = textBase.toLowerCase();

    switch (categoryId) {
      case "cars":
        // Match common Arabic/English words for cars/vehicles
        return (
          text.includes("سيار") || // سيارة / سيارات / السيارات
          text.includes("car") ||
          text.includes("cars")
        );
      default:
        return true;
    }
  }

  function matchesCategoryByText(
    item: SaleItem,
    categoryId: string,
  ): boolean {
    const textBase = `${item.title ?? ""} ${item.description ?? ""} ${
      Array.isArray(item.tags) ? item.tags.join(" ") : ""
    }`;
    const text = textBase.toLowerCase();

    const cat = SALE_CATEGORIES_FOR_UI.find((c) => c.id === categoryId);
    if (!cat) return true;

    // Take the first word of the Arabic and English labels,
    // then use a short "root" (first few characters) for matching.
    const arFirst = (cat.ar || "").split(/[ \-]/)[0];
    const arRoot = arFirst.slice(0, Math.min(4, arFirst.length)).toLowerCase();

    const enFirst = (cat.en || "").split(/[&-]/)[0];
    const enRoot = enFirst.trim().toLowerCase();

    const patterns: string[] = [];
    if (arRoot) patterns.push(arRoot);
    if (enRoot) patterns.push(enRoot);

    return patterns.some(
      (p) => p && text.includes(p),
    );
  }

  useEffect(() => {
    fetchItems();
  }, [city, condition, trade]);

  // Debounced search by query
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchItems();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* hero like services page */}
      <SalesHero />

      <main className="flex-1 pb-12">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="mb-4 text-2xl font-bold">
            {locale === "ar" ? "البيع والتجارة" : "Sales & Trade"}
          </h1>

          {/* category shortcuts */}
          <div className="mb-5">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "تصفح حسب القسم" : "Browse by category"}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {SALE_CATEGORIES_FOR_UI.map((cat) => {
                const selected = activeCategory === cat.id;
                const label = locale === "ar" ? cat.ar : cat.en;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={[
                      "flex flex-col items-center justify-between rounded-xl border px-2 py-3 text-center text-xs sm:text-sm bg-card",
                      selected
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:bg-accent/10",
                    ].join(" ")}
                  >
                    <span className="mb-1 text-2xl">{cat.icon}</span>
                    <span className="line-clamp-2 leading-snug">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* filters container - aligned to the right, width = content only */}
          <div className="mb-4 flex justify-end">
            <div className="rounded-2xl copper-gradient p-[2px]">
              <div className="rounded-[1rem] bg-background px-3 py-2 text-foreground shadow-lg md:px-4 md:py-3">
                {/* filters row */}
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
                  {/* city */}
                  <div className="w-full md:w-auto">
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-10 w-full md:w-44">
                        <SelectValue
                          placeholder={tr(locale, "home.cityPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CITIES">
                          {locale === "ar" ? "كل المدن" : "All cities"}
                        </SelectItem>
                        {libyanCities.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* condition */}
                  <div className="w-full md:w-auto">
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger className="h-10 w-full md:w-40">
                        <SelectValue
                          placeholder={
                            locale === "ar" ? "الحالة" : "Condition"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          {locale === "ar" ? "الكل" : "All"}
                        </SelectItem>
                        <SelectItem value="new">
                          {locale === "ar" ? "جديد" : "New"}
                        </SelectItem>
                        <SelectItem value="like-new">
                          {locale === "ar" ? "شبه جديد" : "Like new"}
                        </SelectItem>
                        <SelectItem value="used">
                          {locale === "ar" ? "مستعمل" : "Used"}
                        </SelectItem>
                        <SelectItem value="for-parts">
                          {locale === "ar" ? "قطع" : "For parts"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* trade only */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="trade"
                      checked={trade}
                      onCheckedChange={(v) => setTrade(!!v)}
                    />
                    <label htmlFor="trade" className="text-sm">
                      {locale === "ar" ? "المبادلة فقط" : "Trade enabled"}
                    </label>
                  </div>

                  {/* buttons (بحث / إعادة تعيين الفلاتر) */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCity("ALL_CITIES");
                        setCondition("ALL");
                        setTrade(false);
                        setQ("");
                      }}
                    >
                      {locale === "ar"
                        ? "إعادة تعيين الفلاتر"
                        : "Reset filters"}
                    </Button>
                    <Button
                      className="bg-power text-white hover:bg-powerDark"
                      onClick={fetchItems}
                    >
                      {tr(locale, "home.search")}
                    </Button>
                  </div>

                  {/* keyword */}
                  <div className="w-full md:w-64">
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="search"
                        value={q}
                        placeholder={tr(locale, "home.searchPlaceholder")}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void fetchItems();
                          }
                        }}
                        className="h-10"
                      />

                      {showSearchCategories && (
                        <div className="absolute inset-x-0 z-30 mt-2 max-h-[320px] overflow-y-auto rounded-xl border bg-popover p-3 shadow-lg">
                          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {locale === "ar"
                                ? "اختر قسمًا للبحث عنه"
                                : "Quick search by category"}
                            </span>
                            <button
                              type="button"
                              className="rounded px-2 py-0.5 hover:bg-muted"
                              onClick={() => setShowSearchCategories(false)}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {SALE_CATEGORIES.map((cat) => {
                              const label =
                                locale === "ar" ? cat.ar : cat.en;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setQ(label);
                                    setShowSearchCategories(false);
                                    void fetchItems();
                                  }}
                                  className="flex flex-col items-center justify-between rounded-lg border bg-card px-2 py-3 text-center text-xs hover:bg-accent"
                                >
                                  <span className="mb-1 text-2xl">
                                    {cat.icon}
                                  </span>
                                  <span className="font-medium leading-snug">
                                    {label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moving strip of owner-promoted sale cards */}
          <div className="mb-5">
            <PromotedSaleStrip take={5} />
          </div>

          <div ref={listRef} />

          {loading ? (
            <p className="text-muted-foreground">
              {tr(locale, "home.loading")}
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-md border p-4 text-muted-foreground">
              {locale === "ar" ? "لا توجد عناصر" : "No items yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {items.map((it) => (
                <SaleCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
