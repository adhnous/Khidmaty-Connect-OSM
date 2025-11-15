"use client";

import { useEffect, useState, useRef } from "react";
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
import CityPicker from "@/components/city-picker";


type SaleCategory = {
  id: string;
  ar: string;
  en: string;
  icon: string;
  query: string;
};

const SALE_CATEGORIES: SaleCategory[] = [
  { id: "stores", ar: "متاجر", en: "Stores", icon: "🏬", query: "متجر محل shop store" },
  { id: "cars", ar: "سيارات ومركبات", en: "Cars & Vehicles", icon: "🚗", query: "سيارة سيارات car vehicle" },
  { id: "bikes", ar: "دراجات نارية", en: "Motorcycles", icon: "🏍️", query: "دراجة نارية موتوسيكل bike" },
  { id: "real-estate-sale", ar: "عقارات للبيع", en: "Property for Sale", icon: "🏠", query: "عقار للبيع بيت منزل شقة" },
  { id: "real-estate-rent", ar: "عقارات للإيجار", en: "Property for Rent", icon: "🗝️", query: "عقار للايجار إيجار" },
  { id: "jobs", ar: "وظائف", en: "Jobs", icon: "💼", query: "وظيفة عمل jobs" },
  { id: "electronics", ar: "الكترونيات", en: "Electronics", icon: "📺", query: "الكترونيات أجهزة كهربائية" },
  { id: "laptops", ar: "لابتوب وكمبيوتر", en: "Laptops & PCs", icon: "💻", query: "لابتوب كمبيوتر laptop" },
  { id: "mobile", ar: "موبايل - تابلت", en: "Mobiles & Tablets", icon: "📱", query: "موبايل هاتف جوال تابلت" },
  { id: "home", ar: "المنزل والحديقة", en: "Home & Garden", icon: "🛋️", query: "أثاث منزل حديقة" },
  { id: "kids", ar: "ألعاب الفيديو والأطفال", en: "Games & Kids", icon: "🎮", query: "ألعاب أطفال" },
  { id: "fashion-men", ar: "أزياء - موضة رجالي", en: "Men's Fashion", icon: "👔", query: "ملابس رجالي" },
  { id: "fashion-women", ar: "أزياء - موضة نسائية", en: "Women's Fashion", icon: "👗", query: "ملابس نسائية" },
  { id: "sports", ar: "معدات رياضية ولياقة", en: "Sports & Fitness", icon: "🏃", query: "معدات رياضية لياقة" },
  { id: "food", ar: "طعام - غذاء", en: "Food & Drinks", icon: "🍔", query: "طعام أكل مطعم" },
  { id: "pets", ar: "حيوانات واكسسوارات", en: "Pets & Accessories", icon: "🐾", query: "حيوانات أليفة" },
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
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
        const tokens = needle
          .split(/\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 1);

        rows = rows.filter((r: any) => {
          const t = String(r?.title || "").toLowerCase();
          const d = String(r?.description || "").toLowerCase();
          const tf = String(r?.trade?.tradeFor || "").toLowerCase();
          const c = String(r?.city || "").toLowerCase();
          const tags: string[] = Array.isArray(r?.tags)
            ? (r.tags as string[])
            : [];

          const inText = tokens.some(
            (tok) =>
              t.includes(tok) ||
              d.includes(tok) ||
              tf.includes(tok) ||
              c.includes(tok),
          );

          const inTags = tags.some((x) => {
            const v = String(x || "").toLowerCase();
            return tokens.some((tok) => v.includes(tok));
          });

          return inText || inTags;
        });
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
    } else {
      setActiveCategory(cat.id);
      setQ(cat.query || (locale === "ar" ? cat.ar : cat.en));
    }

    // On mobile, scroll results into view after choosing a category
    try {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        const el = resultsRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    } catch {
      // ignore scroll errors
    }
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

          {/* filters container – aligned to the right, width = content only */}
          <div className="mb-4 flex justify-end">
            <div className="rounded-2xl copper-gradient p-[2px]">
              <div className="rounded-[1rem] bg-background px-3 py-2 text-foreground shadow-lg md:px-4 md:py-3">
                {/* filters row */}
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
                 {/* city */}
<div className="w-full md:w-auto">
  <CityPicker
    locale={locale === "ar" ? "ar" : "en"}
    value={city}
    onChange={(val) => setCity(val)}
    options={libyanCities}
    placeholder={
      (tr(locale, "home.cityPlaceholder") as string) ||
      (locale === "ar" ? "ابحث عن مدينة" : "Search city")
    }
    className="h-10 w-full md:w-44"
    allOption={{
      value: "ALL_CITIES",
      label: locale === "ar" ? "كل المدن" : "All cities",
    }}
  />
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* category shortcuts */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              {locale === "ar" ? "تصفح حسب القسم" : "Browse by category"}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {SALE_CATEGORIES.map((cat) => {
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

          {/* Moving strip of owner-promoted sale cards */}
          <div ref={resultsRef} className="mb-5">
            <PromotedSaleStrip take={5} />
          </div>

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
