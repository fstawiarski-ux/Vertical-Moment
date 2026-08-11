"use client";

import { useEffect, useState } from "react";
import type { ViewportMode } from "../core/types";

function modeForWidth(width: number): ViewportMode {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>("desktop");

  useEffect(() => {
    const update = () => setMode(modeForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}
