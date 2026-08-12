import { describe, expect, it } from "vitest";
import { buildContentEntries, fuzzyScore, scoreEntry, searchEntries, type SearchEntry } from "./searchIndex";
import type { ExploreContentBox, ExploreContentRegistry } from "./types";

function box(partial: Partial<ExploreContentBox> & Pick<ExploreContentBox, "id" | "title" | "crag" | "region">): ExploreContentBox {
  return {
    type: "gallery",
    description: "",
    initialLayout: { x: 0, y: 0, width: 100, height: 100 },
    ...partial,
  } as ExploreContentBox;
}

const registry = {
  boxes: [
    box({ id: "vm-7073", title: "Steep Ground", region: "Vienna Limestone Belt", crag: "Peilstein" }),
    box({ id: "note-north-face", title: "A Face That Never Gets Sun", region: "Vienna Limestone Belt", crag: "Peilstein", type: "note" }),
    box({ id: "nasenwand-spatial", title: "Nasenwand Routes", region: "Wachau", crag: "Nasenwand", sector: "Upper", type: "nasenwand" }),
    box({ id: "nasenwand-model", title: "Nasenwand 3D", region: "Wachau", crag: "Nasenwand", sector: "Upper", type: "model3d" }),
    box({ id: "wachau-16", title: "Wachau Panorama", region: "Wachau", crag: "Wachau", type: "panorama" }),
  ],
} as ExploreContentRegistry;

const action: SearchEntry = {
  id: "action:reset",
  kind: "action",
  label: "Reset layout",
  detail: "Layout",
  terms: "reset restore default original layout start over",
};

describe("fuzzyScore", () => {
  it("returns 0 when the characters are not present in order", () => {
    expect(fuzzyScore("zzz", "Nasenwand")).toBe(0);
    expect(fuzzyScore("dnawnesan", "Nasenwand")).toBe(0);
  });

  it("ranks a prefix above an interior match above a subsequence", () => {
    const prefix = fuzzyScore("nasen", "Nasenwand Routes");
    const interior = fuzzyScore("routes", "Nasenwand Routes");
    const subsequence = fuzzyScore("nwr", "Nasenwand Routes");
    expect(prefix).toBeGreaterThan(interior);
    expect(interior).toBeGreaterThan(subsequence);
    expect(subsequence).toBeGreaterThan(0);
  });

  it("rewards a match starting at a word boundary", () => {
    // Both are interior matches; only the first starts a word.
    expect(fuzzyScore("sector", "Upper Sector")).toBeGreaterThan(fuzzyScore("ector", "Upper Sector"));
  });

  it("is case insensitive", () => {
    expect(fuzzyScore("NASEN", "Nasenwand")).toBe(fuzzyScore("nasen", "nasenwand"));
  });

  it("treats an empty query as a neutral match", () => {
    expect(fuzzyScore("", "anything")).toBe(1);
  });
});

describe("scoreEntry", () => {
  it("weights the visible label above the hidden term blob", () => {
    const titled: SearchEntry = { id: "a", kind: "module", label: "Panorama", detail: "", terms: "unrelated" };
    const described: SearchEntry = { id: "b", kind: "module", label: "Unrelated", detail: "", terms: "panorama" };
    expect(scoreEntry("panorama", titled)).toBeGreaterThan(scoreEntry("panorama", described));
  });
});

describe("searchEntries", () => {
  const entries = [...buildContentEntries(registry), action];

  it("returns entries ordered by kind when the query is empty", () => {
    const results = searchEntries("", entries);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].kind).toBe("module");
  });

  it("puts every Nasenwand entry above anything else and excludes the rest", () => {
    const results = searchEntries("nasen", entries);
    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      expect(`${entry.label} ${entry.detail}`.toLowerCase(), `unexpected result: ${entry.label}`).toContain("nasenwand");
    }
  });

  it("drops scattered subsequence noise via the relevance floor", () => {
    // "nasen" appears as a subsequence in "Vienna Limestone Belt" style entries;
    // the floor must keep those out once a real match exists.
    const labels = searchEntries("nasen", entries).map((entry) => entry.label);
    expect(labels).not.toContain("Vienna Limestone Belt");
    expect(labels).not.toContain("Reset layout");
  });

  it("still returns weak matches when nothing better exists", () => {
    const results = searchEntries("rst", [action]);
    expect(results.map((entry) => entry.id)).toEqual(["action:reset"]);
  });

  it("finds commands by intent words held only in terms", () => {
    expect(searchEntries("restore", entries)[0].id).toBe("action:reset");
  });

  it("returns nothing when the query matches nothing", () => {
    expect(searchEntries("qqqq", entries)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchEntries("", entries, 3)).toHaveLength(3);
  });
});

describe("buildContentEntries", () => {
  const entries = buildContentEntries(registry);
  const kinds = (kind: SearchEntry["kind"]) => entries.filter((entry) => entry.kind === kind);

  it("creates one entry per module", () => {
    expect(kinds("module")).toHaveLength(registry.boxes.length);
  });

  it("deduplicates places across boxes that share them", () => {
    expect(kinds("region").map((entry) => entry.label).sort()).toEqual(["Vienna Limestone Belt", "Wachau"]);
    expect(kinds("crag").map((entry) => entry.label).sort()).toEqual(["Nasenwand", "Peilstein", "Wachau"]);
    // Three Nasenwand boxes share one Upper sector.
    expect(kinds("sector")).toHaveLength(1);
  });

  it("points every place at a real box so nothing can be opened into a void", () => {
    const ids = new Set(registry.boxes.map((entry) => entry.id));
    for (const entry of entries) {
      expect(entry.boxId, `${entry.label} has no box`).toBeDefined();
      expect(ids.has(entry.boxId!), `${entry.label} points at a missing box`).toBe(true);
    }
  });

  it("shows the full place path as a module's detail line", () => {
    const nasenwand = entries.find((entry) => entry.id === "module:nasenwand-spatial");
    expect(nasenwand?.detail).toBe("Wachau · Nasenwand · Upper");
  });

  it("omits an absent sector from the detail line", () => {
    expect(entries.find((entry) => entry.id === "module:wachau-16")?.detail).toBe("Wachau · Wachau");
  });
});
