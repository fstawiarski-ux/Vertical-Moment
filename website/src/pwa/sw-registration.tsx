"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (!disposed) void registration.update();
      } catch (error) {
        console.warn("Explore Lab service worker registration failed.", error);
      }
    };
    void register();
    return () => { disposed = true; };
  }, []);

  return null;
}
