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
          scope: "/",
          updateViaCache: "none",
        });
        if (disposed) return;
        // Retire the narrower legacy registration after the new root worker activates.
        const retireLegacy = async () => {
          if (!registration.active) return;
          for (const old of await navigator.serviceWorker.getRegistrations()) {
            if (new URL(old.scope).pathname === "/explore-app" || new URL(old.scope).pathname === "/explore-app/") await old.unregister();
          }
        };
        if (registration.active) void retireLegacy();
        registration.installing?.addEventListener("statechange", () => { if (registration.active) void retireLegacy(); });
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
        void registration.update().catch(() => { /* Keep the active worker when offline or after registration migration. */ });
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
