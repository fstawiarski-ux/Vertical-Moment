import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deepLinkFor,
  hasDeepLink,
  parseDeepLink,
  resolveDeepLink,
  slugify,
  writeDeepLinkToUrl,
} from "./deepLink";
import type { ExploreContentBox, ExploreContentRegistry } from "./types";

function box(partial: Partial<ExploreContentBox> & Pick<ExploreContentBox, "id" | "title" | "crag">): ExploreContentBox {
  return {
    type: "gallery",
    region: "Wachau",
    description: "",
    initialLayout: { x: 0, y: 0, width: 100, height: 100 },
    ...partial,
  } as ExploreContentBox;
}

const registry = {
  boxes: [
    box({ id: "vm-7073", title: "Steep Ground", region: "Vienna Limestone Belt", crag: "Peilstein" }),
    box({ id: "nasenwand-spatial", title: "Nasenwand Routes", crag: "Nasenwand", sector: "Upper", type: "nasenwand" }),
    box({ id: "nasenwand-model", title: "Nasenwand 3D", crag: "Nasenwand", sector: "Upper", type: "model3d" }),
    box({ id: "wachau-16", title: "Wachau Panorama", crag: "Wachau", type: "panorama" }),
    box({ id: "crag-locator", title: "Crag Locator", region: "Vienna Limestone Belt", crag: "Vienna Limestone Belt", type: "atlas" }),
  ],
} as ExploreContentRegistry;

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Nasenwand Routes")).toBe("nasenwand-routes");
    expect(slugify("Wachau Panorama")).toBe("wachau-panorama");
  });

  it("strips diacritics via NFKD rather than mangling them", () => {
    expect(slugify("Mödling")).toBe("modling");
    expect(slugify("Gesäuse")).toBe("gesause");
  });

  it("collapses runs of punctuation and trims edge hyphens", () => {
    expect(slugify("  Upper — Sector / 2  ")).toBe("upper-sector-2");
    expect(slugify("Nasenwand 3D")).toBe("nasenwand-3d");
  });
});

describe("parseDeepLink", () => {
  it("reads every supported parameter", () => {
    expect(parseDeepLink("?open=a&crag=b&sector=c&intro=skip&mode=fullscreen")).toEqual({
      open: "a", crag: "b", sector: "c", intro: "skip", mode: "fullscreen",
    });
  });

  it("ignores unknown parameters, including the installed app's own start_url", () => {
    const request = parseDeepLink("?source=pwa&utm_medium=email");
    expect(request).toEqual({ open: null, crag: null, sector: null, intro: null, mode: null });
    expect(hasDeepLink(request)).toBe(false);
  });

  it("rejects intro and mode values outside the contract", () => {
    const request = parseDeepLink("?intro=maybe&mode=minimized");
    expect(request.intro).toBeNull();
    // "minimized" is a BoxMode but not something a link may open a box into.
    expect(request.mode).toBeNull();
  });

  it("treats a bare intro as a deep link even with no target", () => {
    expect(hasDeepLink(parseDeepLink("?intro=play"))).toBe(true);
  });
});

describe("resolveDeepLink", () => {
  const resolve = (search: string) => resolveDeepLink(parseDeepLink(search), registry);

  it("matches a box id", () => {
    expect(resolve("?open=nasenwand-model")).toEqual({ boxId: "nasenwand-model", mode: "expanded" });
  });

  it("matches a slugged title, which is what the manifest shortcuts use", () => {
    expect(resolve("?open=wachau-panorama")?.boxId).toBe("wachau-16");
    expect(resolve("?open=nasenwand-routes")?.boxId).toBe("nasenwand-spatial");
    expect(resolve("?open=crag-locator")?.boxId).toBe("crag-locator");
  });

  it("is case and separator insensitive", () => {
    expect(resolve("?open=Wachau%20Panorama")?.boxId).toBe("wachau-16");
    expect(resolve("?open=NASENWAND-ROUTES")?.boxId).toBe("nasenwand-spatial");
  });

  it("defaults to expanded and honours an explicit mode", () => {
    expect(resolve("?open=crag-locator")?.mode).toBe("expanded");
    expect(resolve("?open=crag-locator&mode=fullscreen")?.mode).toBe("fullscreen");
    expect(resolve("?open=crag-locator&mode=normal")?.mode).toBe("normal");
  });

  it("resolves a crag to its first box", () => {
    expect(resolve("?crag=nasenwand")?.boxId).toBe("nasenwand-spatial");
  });

  it("narrows a crag by sector when one matches", () => {
    expect(resolve("?crag=nasenwand&sector=upper")?.boxId).toBe("nasenwand-spatial");
  });

  it("still opens the crag when the sector is unknown", () => {
    expect(resolve("?crag=nasenwand&sector=does-not-exist")?.boxId).toBe("nasenwand-spatial");
  });

  it("returns null for an unknown target rather than guessing", () => {
    expect(resolve("?open=not-a-module")).toBeNull();
    expect(resolve("?crag=atlantis")).toBeNull();
    expect(resolve("")).toBeNull();
  });

  it("prefers open over crag when both are present", () => {
    expect(resolve("?open=wachau-panorama&crag=nasenwand")?.boxId).toBe("wachau-16");
  });

  it("falls back to crag when open does not resolve", () => {
    expect(resolve("?open=nonsense&crag=nasenwand")?.boxId).toBe("nasenwand-spatial");
  });
});

describe("deepLinkFor", () => {
  it("round-trips back to the same box", () => {
    for (const original of registry.boxes) {
      const link = deepLinkFor(original);
      const resolved = resolveDeepLink(parseDeepLink(link.slice(link.indexOf("?"))), registry);
      expect(resolved?.boxId, `${original.id} did not round-trip via ${link}`).toBe(original.id);
    }
  });

  it("includes sector only when the box has one", () => {
    expect(deepLinkFor(registry.boxes[1])).toContain("sector=upper");
    expect(deepLinkFor(registry.boxes[3])).not.toContain("sector=");
  });
});

describe("writeDeepLinkToUrl", () => {
  const replaceState = vi.fn();

  const stubWindow = (href: string) => {
    vi.stubGlobal("window", {
      location: { href },
      history: { state: null, replaceState },
    });
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    replaceState.mockClear();
  });

  it("writes the focused box into the query string", () => {
    stubWindow("https://verticalmoment.com/explore-app");
    writeDeepLinkToUrl(registry.boxes[1]);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/explore-app?open=nasenwand-routes&crag=nasenwand&sector=upper");
  });

  it("clears deep-link parameters when nothing is focused", () => {
    stubWindow("https://verticalmoment.com/explore-app?open=nasenwand-routes&crag=nasenwand&sector=upper");
    writeDeepLinkToUrl(null);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/explore-app");
  });

  it("preserves unrelated parameters such as the installed start_url marker", () => {
    stubWindow("https://verticalmoment.com/explore-app?source=pwa&intro=skip");
    writeDeepLinkToUrl(null);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/explore-app?source=pwa");
  });
});
