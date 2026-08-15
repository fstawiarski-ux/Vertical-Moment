import type { BoxMode, ExploreContentBox, ExploreContentRegistry } from "./types";

/**
 * Deep links let verticalmoment.com hand a visitor straight to one module:
 *
 *   /explore-app?open=nasenwand-model
 *   /explore-app?open=wachau-panorama
 *   /explore-app?crag=nasenwand&sector=upper
 *   /explore-app?open=crag-locator&intro=skip
 *
 * `?source=pwa` (the installed manifest start_url) and any other unknown
 * parameter is ignored rather than treated as a failed lookup.
 */
export interface DeepLinkRequest {
  open: string | null;
  crag: string | null;
  sector: string | null;
  intro: "skip" | "play" | null;
  mode: BoxMode | null;
}

export interface DeepLinkTarget {
  boxId: string;
  mode: BoxMode;
}

const OPENABLE_MODES = new Set<BoxMode>(["normal", "expanded", "fullscreen"]);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    // NFKD splits "ö" into "o" + a combining mark. That mark has to be deleted
    // outright: leaving it to the punctuation rule below turns it into a
    // separator, so "Mödling" would slug to "mo-dling". Austrian crag names are
    // full of umlauts, so this is the common case, not an edge case.
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseDeepLink(search: string): DeepLinkRequest {
  const params = new URLSearchParams(search);
  const intro = params.get("intro");
  const mode = params.get("mode");

  return {
    open: params.get("open"),
    crag: params.get("crag"),
    sector: params.get("sector"),
    intro: intro === "skip" || intro === "play" ? intro : null,
    mode: mode && OPENABLE_MODES.has(mode as BoxMode) ? mode as BoxMode : null,
  };
}

export function hasDeepLink(request: DeepLinkRequest): boolean {
  return Boolean(request.open || request.crag || request.sector || request.intro);
}

/**
 * Every alias a box answers to. Ids stay authoritative, but slugged titles mean
 * a readable link like `?open=wachau-panorama` resolves without a lookup table
 * that would drift from the registry.
 */
function aliasesFor(box: ExploreContentBox): string[] {
  const aliases = [box.id, slugify(box.id), slugify(box.title), `${slugify(box.crag)}-${box.type}`];
  if (box.sector) aliases.push(`${slugify(box.crag)}-${slugify(box.sector)}`);
  return aliases;
}

export function resolveDeepLink(
  request: DeepLinkRequest,
  registry: ExploreContentRegistry,
): DeepLinkTarget | null {
  const mode = request.mode ?? "expanded";

  if (request.open) {
    const wanted = slugify(request.open);
    const match = registry.boxes.find((box) => aliasesFor(box).some((alias) => slugify(alias) === wanted));
    if (match) return { boxId: match.id, mode };
  }

  if (request.crag) {
    const wantedCrag = slugify(request.crag);
    const candidates = registry.boxes.filter((box) => slugify(box.crag) === wantedCrag);
    if (candidates.length > 0) {
      // A sector, when given, narrows the crag rather than replacing it — an
      // unknown sector still opens the crag instead of failing outright.
      const wantedSector = request.sector ? slugify(request.sector) : null;
      const sectorMatch = wantedSector
        ? candidates.find((box) => box.sector && slugify(box.sector) === wantedSector)
        : undefined;
      return { boxId: (sectorMatch ?? candidates[0]).id, mode };
    }
  }

  return null;
}

/**
 * Mirrors the focused module back into the address bar so the URL is always
 * copyable. Uses replaceState: workspace focus is not browser history.
 */
export function writeDeepLinkToUrl(box: ExploreContentBox | null): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  for (const key of ["open", "crag", "sector", "intro", "mode"]) url.searchParams.delete(key);

  if (box) {
    url.searchParams.set("open", slugify(box.title));
    url.searchParams.set("crag", slugify(box.crag));
    if (box.sector) url.searchParams.set("sector", slugify(box.sector));
    // The address bar reflects current focus, not an explicit request to make
    // one module exclusive. This keeps restored tablet/desktop workspaces
    // intact across reloads while bare shared links still open expanded.
    url.searchParams.set("mode", "normal");
  }

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

/** The shareable link for a module, used by the command palette's copy action. */
export function deepLinkFor(box: ExploreContentBox): string {
  const search = new URLSearchParams({ open: slugify(box.title), crag: slugify(box.crag) });
  if (box.sector) search.set("sector", slugify(box.sector));
  return `/explore-app?${search.toString()}`;
}
