"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Wrench,
  LifeBuoy,
  GraduationCap,
  BriefcaseBusiness,
  Stethoscope,
  Truck,
  Megaphone,
  Hammer,
  ShoppingCart,
} from "lucide-react";

type Locale = "en" | "ar";

export type CategoryCardId =
  | "repair"
  | "consulting"
  | "education"
  | "hr"
  | "medical"
  | "transport"
  | "creative"
  | "sales"
  | "crafts";

export const CATEGORY_DEFS: Record<
  CategoryCardId,
  { ar: string; en: string; Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  repair: { ar: "الصيانة والتصليح", en: "Maintenance & Repair", Icon: Wrench, color: "bg-orange-100 text-orange-700" },
  consulting: { ar: "استشارات ودعم", en: "Consulting & Support", Icon: LifeBuoy, color: "bg-sky-100 text-sky-700" },
  education: { ar: "التعليم والتدريب والتطوير", en: "Education & Training", Icon: GraduationCap, color: "bg-emerald-100 text-emerald-700" },
  hr: { ar: "التوظيف والموارد البشرية", en: "HR & Recruitment", Icon: BriefcaseBusiness, color: "bg-stone-100 text-stone-700" },
  medical: { ar: "خدمات صحية وطبية", en: "Health & Medical", Icon: Stethoscope, color: "bg-rose-100 text-rose-700" },
  transport: { ar: "النقل والمواصلات والتوصيل", en: "Transport & Delivery", Icon: Truck, color: "bg-indigo-100 text-indigo-700" },
  creative: { ar: "الاعلانات التصميم والإبداع", en: "Advertising & Creative", Icon: Megaphone, color: "bg-fuchsia-100 text-fuchsia-700" },
  crafts: { ar: "اعمال مهنية وحرف يدوية", en: "Skilled Trades & Crafts", Icon: Hammer, color: "bg-amber-100 text-amber-700" },
};

export function CategoryCards({
  locale,
  selectedId,
  onSelect,
  size = 'md',
  tone = 'solid',
}: {
  locale: Locale;
  selectedId?: string | null;
  onSelect(id: CategoryCardId): void;
  size?: 'sm' | 'md';
  tone?: 'solid' | 'translucent';
}) {
  const isSm = size === 'sm';
  const translucent = tone === 'translucent';
  const entries = Object.entries(CATEGORY_DEFS) as [CategoryCardId, (typeof CATEGORY_DEFS)[CategoryCardId]][];
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
      {entries.map(([id, def]) => {
        const isSelected = selectedId === id;
        const label = locale === "ar" ? def.ar : def.en;
        const Icon = def.Icon;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onSelect(id)}
            aria-pressed={isSelected}
            className={cn(
              "text-start",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-lg"
            )}
          >
            <Card
              className={cn(
                "transition border-2",
                isSelected ? "border-primary" : "border-transparent hover:border-muted"
              )}
            >
              <CardContent className={cn("flex items-center gap-3", isSm ? 'p-3' : 'p-4')}>
                <span
                  className={cn(
                    "grid place-items-center rounded",
                    isSm ? 'h-9 w-9' : 'h-10 w-10',
                    translucent ? 'bg-white/10 text-foreground ring-1 ring-white/15' : def.color
                  )}
                >
                  <Icon className={cn(isSm ? 'h-4 w-4' : 'h-5 w-5')} />
                </span>
                <span className={cn(isSm ? 'text-xs' : 'text-sm', "font-medium", isSelected ? "text-primary" : "")}>{label}</span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

