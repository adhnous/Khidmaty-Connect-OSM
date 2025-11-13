"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CityOption } from "@/lib/cities";

type Locale = "ar" | "en";

type CityPickerProps = {
  locale: Locale;
  value?: string;
  onChange: (value: string) => void;
  options: CityOption[];
  placeholder?: string;
  className?: string;
  allOption?: { value: string; label: string };
};

export default function CityPicker({ locale, value, onChange, options, placeholder, className, allOption }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  function normalizeArabic(input: string): string {
    try {
      const s = String(input || "").toLowerCase();
      // Remove Arabic diacritics and tatweel
      const noMarks = s.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
      // Unify alef variants and yaa/taa marbuta
      return noMarks
        .replace(/[\u0622\u0623\u0625]/g, "ا") // آ أ إ -> ا
        .replace(/\u0629/g, "ه")               // ة -> ه (improves loose matching)
        .replace(/\u0649/g, "ي");              // ى -> ي
    } catch {
      return String(input || "").toLowerCase();
    }
  }

  function labelOf(v?: string): string {
    if (v && allOption && v === allOption.value) return allOption.label;
    const found = options.find((c) => c.value === v);
    if (!found) return String(v || "");
    return locale === "ar" ? found.ar : found.value;
  }

  useEffect(() => {
    setQuery(value ? labelOf(value) : "");
  }, [value, locale]);

  useEffect(() => {
    if (open) {
      try {
        const el = panelInputRef.current || inputRef.current;
        el?.focus();
        if (el) {
          const len = el.value.length;
          (el as HTMLInputElement).setSelectionRange(len, len);
        }
      } catch {}
      try {
        const currentLabel = value ? labelOf(value) : "";
        if (query === currentLabel) {
          setQuery("");
        }
        setActiveIndex(0);
      } catch {}
      setTimeout(recalcScroll, 0);
    }
  }, [open]);

  const items = useMemo(() => {
    const base = options.map((c) => {
      const arRaw = String(c.ar || "");
      return {
        value: c.value,
        label: locale === "ar" ? arRaw : c.value,
        ar: arRaw.toLowerCase(),
        arNorm: normalizeArabic(arRaw),
        en: c.value.toLowerCase(),
        isAll: false as const,
      };
    });
    const all = allOption
      ? [{
          value: allOption.value,
          label: allOption.label,
          ar: allOption.label.toLowerCase(),
          arNorm: normalizeArabic(allOption.label.toLowerCase()),
          en: allOption.label.toLowerCase(),
          isAll: true as const,
        }, ...base]
      : base;
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, locale, allOption?.value, allOption?.label]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const qNorm = normalizeArabic(q);
    return items.filter((it) => it.en.includes(q) || it.ar.includes(q) || (it as any).arNorm.includes(qNorm));
  }, [query, items]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    setTimeout(recalcScroll, 0);
  }, [filtered.length]);

  function recalcScroll() {
    const el = listRef.current;
    if (!el) { setCanUp(false); setCanDown(false); return; }
    setCanUp(el.scrollTop > 0);
    setCanDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  function scrollByAmount(delta: number) {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(recalcScroll, 150);
  }

  function select(val: string) {
    onChange(val);
    setQuery(labelOf(val));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <Input
          ref={inputRef as any}
          value={query}
          placeholder={placeholder || (locale === "ar" ? "ابحث عن مدينة" : "Search city")}
          className={className}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={(e) => {
            setOpen(true);
            const currentLabel = value ? labelOf(value) : "";
            if (query === currentLabel) setQuery("");
            try { (e.currentTarget as HTMLInputElement).select(); } catch {}
          }}
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
      </PopoverPrimitive.Anchor>
      <PopoverContent
        align="start"
        className="z-[9999] p-0 w-[--radix-popper-anchor-width]"
        onPointerDownOutside={(e) => {
          const anchor = inputRef.current;
          const t = e.target as Node | null;
          if (anchor && (t === anchor || (t && anchor.contains(t)))) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const anchor = inputRef.current;
          const t = e.target as Node | null;
          if (anchor && (t === anchor || (t && anchor.contains(t)))) {
            e.preventDefault(); // don't close when clicking the input (anchor)
          }
        }}
      >
        <div className="p-2 border-b">
          <Input
            ref={panelInputRef as any}
            value={query}
            placeholder={locale === "ar" ? "ابحث عن مدينة" : "Search city"}
            className="h-9"
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); const item = filtered[0]; if (item) select(item.value); }
              else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0))); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Escape") { setOpen(false); }
            }}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            className={`absolute left-1/2 -translate-x-1/2 top-1 z-[1] h-6 w-6 grid place-items-center rounded-full bg-accent/60 text-foreground ${canUp ? '' : 'opacity-40 pointer-events-none'}`}
            onClick={() => scrollByAmount(-160)}
            aria-label="Up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div
            ref={listRef}
            className="max-h-80 overflow-auto"
            onScroll={recalcScroll}
          >
            <ul className="divide-y">
              {filtered.map((it, idx) => (
                <li key={`${it.isAll ? "__all" : "city"}-${it.value}`}>
                  <button
                    type="button"
                    className={`w-full text-start px-3 py-2 text-sm ${idx === activeIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => { e.preventDefault(); select(it.value); }}
                  >
                    {it.label}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا نتائج" : "No results"}
                </li>
              )}
            </ul>
          </div>
          <button
            type="button"
            className={`absolute left-1/2 -translate-x-1/2 bottom-1 z-[1] h-6 w-6 grid place-items-center rounded-full bg-accent/60 text-foreground ${canDown ? '' : 'opacity-40 pointer-events-none'}`}
            onClick={() => scrollByAmount(160)}
            aria-label="Down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
