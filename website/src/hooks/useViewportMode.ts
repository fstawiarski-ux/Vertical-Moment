"use client";

import { useEffect, useState } from "react";
import type { ViewportMode } from "../core/types";

export function modeForViewport(width: number, height: number): ViewportMode {
  // A rotated phone is still a phone: its short viewport height should not
  // promote it into a desktop canvas. Phone is the only compact interaction
  // contract for now; tablet-specific work is intentionally deferred.
  if (width < 768 || height < 540) return "mobile";
  return "desktop";
}

export function usesUnifiedHierarchy(viewportMode: ViewportMode, responsivePreview: string | null): boolean {
  return viewportMode !== "mobile" && responsivePreview !== "baseline";
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>("desktop");

  useEffect(() => {
    const update = () => setMode(modeForViewport(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}
