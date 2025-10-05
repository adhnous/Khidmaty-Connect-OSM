"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        // Register the service worker from the public folder
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Optionally, listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            // You can show a toast here that an update is available
            // when newWorker.state === 'installed'
          });
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[sw] registration failed", err);
      }
    };

    // Delay to avoid blocking hydration
    const t = setTimeout(register, 500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
