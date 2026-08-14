"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let removeUpdateListener: (() => void) | null = null;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/explore-app",
          updateViaCache: "none",
        });
        if (disposed) return;
        const announceUpdate = () => {
          if (registration.waiting) window.dispatchEvent(new Event("vm:sw-update-available"));
        };
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", announceUpdate);
        });
        const applyUpdate = () => registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        window.addEventListener("vm:sw-apply-update", applyUpdate);
        removeUpdateListener = () => window.removeEventListener("vm:sw-apply-update", applyUpdate);
        announceUpdate();
        void registration.update();
      } catch (error) {
        console.warn("Explore Lab service worker registration failed.", error);
      }
    };
    void register();
    return () => {
      disposed = true;
      removeUpdateListener?.();
    };
  }, []);

  return null;
}
