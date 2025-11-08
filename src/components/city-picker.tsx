"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CityOption } from "@/lib/cities";

type Locale = "ar" | "en";

type CityPickerProps = {
  locale: Locale;
  value?: string;
  onChange: (value: string) => void;
  options: CityOption[];
  placeholder?: string;
};

export default function CityPicker({ locale, value, onChange, options, placeholder }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  function labelOf(v?: string): string {
    const found = options.find((c) => c.value === v);
    if (!found) return String(v || "");
    return locale === "ar" ? found.ar : found.value;
  }

  useEffect(() => {
    setQuery(value ? labelOf(value) : "");
  }, [value, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((c) =>
      c.value.toLowerCase().includes(q) || (c.ar || "").toLowerCase().includes(q)
    );
  }, [query, options]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  function select(val: string) {
    onChange(val);
    setQuery(labelOf(val));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={query}
          placeholder={placeholder || (locale === "ar" ? "ابحث عن مدينة" : "Search city")}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const item = filtered[activeIndex] || filtered[0];
              if (item) select(item.value);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-[--radix-popover-trigger-width]">
        <ScrollArea className="max-h-64">
          <ul className="divide-y">
            {filtered.map((c, idx) => (
              <li key={c.value}>
                <button
                  type="button"
                  className={`w-full text-start px-3 py-2 text-sm ${idx === activeIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => { e.preventDefault(); select(c.value); }}
                >
                  {locale === "ar" ? c.ar : c.value}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {locale === "ar" ? "لا نتائج" : "No results"}
              </li>
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
