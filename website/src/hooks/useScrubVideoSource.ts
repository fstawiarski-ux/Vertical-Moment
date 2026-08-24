"use client";

import { useEffect, useState } from "react";

export type ScrubVideoSourceStatus = "idle" | "loading" | "ready" | "error";

export interface ScrubVideoSource {
  src: string | null;
  status: ScrubVideoSourceStatus;
}

/**
 * Fetches an intent-gated scrub derivative in full before handing it to video.
 * Cloudflare Static Assets can return a full 200 response to a cold Range
 * request; a blob URL gives the browser a locally seekable source on visit one.
 */
export function useScrubVideoSource(src: string | null, enabled: boolean): ScrubVideoSource {
  const [source, setSource] = useState<ScrubVideoSource>({ src: null, status: "idle" });

  useEffect(() => {
    if (!enabled || !src) {
      setSource({ src: null, status: "idle" });
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setSource({ src: null, status: "loading" });

    void fetch(src, { cache: "force-cache", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Scrub media request failed with ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSource({ src: objectUrl, status: "ready" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        setSource({ src: null, status: "error" });
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, src]);

  return source;
}
