"use client";

const INTRO_KEY = "vertical-moment:explore-app:intro";
const INTRO_VERSION = 1;

interface PersistedIntro {
  version: number;
  /** ISO date of the first completed journey, kept for future "last visited" copy. */
  seenAt: string;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Persistence lives beside the workspace layout in IndexedDB so that clearing
 * site data clears the journey memory with it. Every call is defensive: private
 * browsing modes and locked-down storage settings must degrade to "not seen"
 * rather than break the app shell.
 */
export async function hasSeenIntro(): Promise<boolean> {
  try {
    const { get } = await import("idb-keyval");
    const record = await get<PersistedIntro>(INTRO_KEY);
    return record?.version === INTRO_VERSION;
  } catch {
    return false;
  }
}

export async function rememberIntroSeen(): Promise<void> {
  try {
    const { set } = await import("idb-keyval");
    await set(INTRO_KEY, { version: INTRO_VERSION, seenAt: new Date().toISOString() } satisfies PersistedIntro);
  } catch {
    /* The journey simply plays again next visit. */
  }
}

