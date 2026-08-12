import type { ExploreContentBox, ExploreContentRegistry } from "./types";

export type SearchEntryKind = "module" | "region" | "crag" | "sector" | "action";

export interface SearchEntry {
  id: string;
  kind: SearchEntryKind;
  label: string;
  detail: string;
  /** Everything the entry can be matched against, lowercased and space joined. */
  terms: string;
  /** Content entries open a box; action entries run a command. */
  boxId?: string;
  run?: () => void;
  shortcut?: string;
}

const RELEVANCE_FLOOR = 0.12;

const KIND_ORDER: Record<SearchEntryKind, number> = {
  module: 0,
  crag: 1,
  sector: 2,
  region: 3,
  action: 4,
};

/**
 * Ranks a query against one string. Returns 0 for no match so callers can drop
 * the entry entirely.
 *
 * Exact prefixes beat interior substrings, interior substrings beat scattered
 * subsequences, and a subsequence scores better when its characters run
 * together — so "nsw" still finds "Nasenwand" but never outranks typing "nase".
 */
export function fuzzyScore(query: string, haystack: string): number {
  if (!query) return 1;
  const needle = query.toLowerCase();
  const hay = haystack.toLowerCase();

  const direct = hay.indexOf(needle);
  if (direct === 0) return 1000;
  if (direct > 0) {
    const boundary = /[\s\-·/]/.test(hay[direct - 1]);
    return (boundary ? 800 : 600) - Math.min(direct, 100);
  }

  let score = 0;
  let cursor = 0;
  let streak = 0;
  for (const character of needle) {
    const found = hay.indexOf(character, cursor);
    if (found === -1) return 0;
    streak = found === cursor ? streak + 1 : 0;
    score += 10 + streak * 4 - Math.min(found - cursor, 12);
    cursor = found + 1;
  }
  return Math.max(1, score);
}

export function scoreEntry(query: string, entry: SearchEntry): number {
  if (!query) return 1;
  // The visible label carries more weight than the hidden term blob, so a
  // description word never outranks a title hit.
  return Math.max(fuzzyScore(query, entry.label) * 1.5, fuzzyScore(query, entry.terms));
}

export function searchEntries(query: string, entries: SearchEntry[], limit = 12): SearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [...entries]
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
      .slice(0, limit);
  }

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(trimmed, entry) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind]);

  if (scored.length === 0) return [];

  // A scattered subsequence scores an order of magnitude below a real substring
  // hit. Without a floor, "nasen" would list every unrelated entry whose letters
  // merely appear in order, pushing the five genuine Nasenwand results into a
  // crowd. Relative to the best match, so a weak-but-only match still shows.
  const floor = scored[0].score * RELEVANCE_FLOOR;
  return scored
    .filter((candidate) => candidate.score >= floor)
    .slice(0, limit)
    .map((candidate) => candidate.entry);
}

function moduleEntry(box: ExploreContentBox): SearchEntry {
  const place = [box.region, box.crag, box.sector].filter(Boolean).join(" · ");
  return {
    id: `module:${box.id}`,
    kind: "module",
    label: box.title,
    detail: place,
    terms: [box.title, box.region, box.crag, box.sector, box.type, box.description, ...(box.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    boxId: box.id,
  };
}

/**
 * Builds the place entries — region, crag and sector — from the boxes
 * themselves, so the palette can never list a crag with nothing behind it.
 * Each place points at its first module, which is what opening it does.
 */
export function buildContentEntries(registry: ExploreContentRegistry): SearchEntry[] {
  const entries: SearchEntry[] = registry.boxes.map(moduleEntry);
  const seen = new Set<string>();

  for (const box of registry.boxes) {
    const places: Array<{ kind: SearchEntryKind; key: string; label: string; detail: string }> = [
      { kind: "region", key: `region:${box.region}`, label: box.region, detail: "Region" },
      { kind: "crag", key: `crag:${box.crag}`, label: box.crag, detail: `Crag · ${box.region}` },
    ];
    if (box.sector) {
      places.push({
        kind: "sector",
        key: `sector:${box.crag}:${box.sector}`,
        label: `${box.sector} Sector`,
        detail: `Sector · ${box.crag}`,
      });
    }

    for (const place of places) {
      if (seen.has(place.key)) continue;
      seen.add(place.key);
      entries.push({
        id: place.key,
        kind: place.kind,
        label: place.label,
        detail: place.detail,
        terms: `${place.label} ${place.detail}`.toLowerCase(),
        boxId: box.id,
      });
    }
  }

  return entries;
}
