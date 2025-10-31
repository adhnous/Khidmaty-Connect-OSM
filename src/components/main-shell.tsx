"use client";

import { usePathname } from "next/navigation";

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isProduct = pathname.startsWith('/dashboard') || pathname.startsWith('/create') || pathname.startsWith('/owner');
  const base = "min-h-[100svh] overflow-x-hidden pb-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] md:pb-8";
  const topPad = isProduct ? "pt-0" : "pt-2";
  return (
    <main id="content" className={`${base} ${topPad}`}>
      {children}
    </main>
  );
}

