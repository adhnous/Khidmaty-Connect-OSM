"use client";

import { useEffect } from "react";

type ThemePreference = "system" | "light" | "dark";

function readThemePreference(): ThemePreference {
  try {
    const raw = String(localStorage.getItem("theme") || "").toLowerCase().trim();
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // ignore
  }
  return "system";
}

function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    "matchMedia" in window &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeInit() {
  useEffect(() => {
    const theme = readThemePreference();
    applyThemePreference(theme);

    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      // Re-read localStorage in case another tab updated it
      const next = readThemePreference();
      applyThemePreference(next);
    };

    try {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      // Safari fallback
      // eslint-disable-next-line deprecation/deprecation
      mq.addListener(onChange);
      // eslint-disable-next-line deprecation/deprecation
      return () => mq.removeListener(onChange);
    }
  }, []);

  return null;
}

