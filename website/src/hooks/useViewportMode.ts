"use client";

import { useEffect, useState } from "react";
import type { ViewportMode } from "../core/types";

export function modeForViewport(width: number, height: number): ViewportMode {
  // A rotated phone is still a phone: its short viewport height should not
  // promote it into the tablet shell. The 1180px ceiling keeps common tablet
  // landscape widths in the tablet layout while preserving desktop canvases.
  if (width < 768 || height < 540) return "mobile";
  if (width < 1180) return "tablet";
  return "desktop";
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
