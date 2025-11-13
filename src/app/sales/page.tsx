"use client";

import { useEffect, useState } from "react";
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

export default function SalesFeedPage() {
  const locale = getClientLocale();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>("ALL_CITIES");
  const [condition, setCondition] = useState<string>("ALL");
  const [trade, setTrade] = useState<boolean>(false);
  const [q, setQ] = useState<string>("");

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
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
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

          {/* Moving strip of owner-promoted sale cards */}
          <div className="mb-5">
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
