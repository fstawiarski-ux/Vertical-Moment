import { describe, expect, it } from "vitest";
import { STATION_PRESENTATIONS } from "./stationPresentation";
import { resolveWorkspaceManifest, stationPresentationsFor } from "./workspaceManifest";
import type { ExploreContentRegistry } from "./types";

const registry = {
  version: 1,
  updatedAt: "2026-08-16T00:00:00Z",
  background: {} as ExploreContentRegistry["background"],
  introScrubSequence: {} as ExploreContentRegistry["introScrubSequence"],
  boxes: [
    { id: "alpha" },
    { id: "beta" },
    { id: "gamma" },
  ],
  workspace: {
    maxBoxes: 8,
    phone: { singleActive: false, primaryModuleIds: ["missing", "beta"] },
    stationFocus: { region: "beta", topo: "gamma" },
  },
  offlinePack: [],
  offlineData: [],
  heavyAssets: [],
} as unknown as ExploreContentRegistry;

describe("workspace manifest", () => {
  it("keeps the workspace capped and phone behavior single-active", () => {
    const resolved = resolveWorkspaceManifest(registry);

    expect(resolved.maxBoxes).toBe(5);
    expect(resolved.phone.singleActive).toBe(true);
    expect(resolved.phone.primaryModuleIds).toEqual(["beta"]);
  });

  it("filters reviewed station focus to available modules with safe fallbacks", () => {
    const resolved = resolveWorkspaceManifest(registry);

    expect(resolved.stationFocus.region).toBe("beta");
    expect(resolved.stationFocus.topo).toBe("gamma");
    expect(resolved.stationFocus.rock).toBe("alpha");
    expect(resolved.stationFocus.sector).toBe("alpha");
  });

  it("keeps the static station copy while allowing content to choose its focus module", () => {
    const resolved = stationPresentationsFor(registry);

    expect(resolved.region.title).toBe(STATION_PRESENTATIONS.region.title);
    expect(resolved.region.focusBoxId).toBe("beta");
    expect(resolved.topo.focusBoxId).toBe("gamma");
  });
});
