"use client";
import { usePathname } from "next/navigation";
import BottomNav from "./bottom-nav";

export default function BottomNavGate() {
  try {
    const pathname = (usePathname() || "").toLowerCase();
    if (pathname.startsWith("/services")) return null;
  } catch {}
  return <BottomNav />;
}
