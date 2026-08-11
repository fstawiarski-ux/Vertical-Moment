"use client";

import { useEffect, useState } from "react";

const CACHE_NAME = "vm-offline-pack-v1";

export function OfflinePackButton({ urls }: { urls: string[] }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "partial">("idle");
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!("caches" in window)) return;
    void caches.open(CACHE_NAME).then(async (cache) => {
      const matches = await Promise.all(urls.map((url) => cache.match(url)));
      if (matches.every(Boolean)) {
        setCompleted(urls.length);
        setStatus("saved");
      }
    });
  }, [urls]);

  const save = async () => {
    if (!("caches" in window) || status === "saving") return;
    setCompleted(0);
    setStatus("saving");
    const cache = await caches.open(CACHE_NAME);
    let failures = 0;
    for (const url of urls) {
      try {
        await cache.add(new Request(url, { cache: "reload" }));
      } catch {
        failures += 1;
      }
      setCompleted((value) => value + 1);
    }
    setStatus(failures ? "partial" : "saved");
  };

  const label = status === "saving"
    ? `Saving ${completed}/${urls.length}`
    : status === "saved"
      ? "Saved offline"
      : status === "partial"
        ? "Retry offline"
        : "Save offline";

  return <button type="button" onClick={() => void save()} disabled={status === "saving"}>{label}</button>;
}
