// The verify-* scripts are the repository's safety net for generated data,
// pilot manifests and the public/private boundary, and until now nothing tested
// them. A guard that has quietly stopped guarding still exits 0, so every check
// keeps reporting PASS while the thing it protects rots.
//
// These are black-box tests: each case builds a throwaway repository tree, drops
// an unmodified copy of the real script into it, runs it as a child process, and
// asserts on the exit code and the message. The scripts themselves are not
// refactored or imported -- what runs here is exactly what runs in CI.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const roots: string[] = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

/** A disposable `<root>/website/...` + `<root>/database/...` tree. */
function makeRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "vm-verify-"));
  roots.push(root);
  mkdirSync(path.join(root, "website", "scripts"), { recursive: true });
  return root;
}

function write(root: string, relative: string, contents: string | object): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, typeof contents === "string" ? contents : `${JSON.stringify(contents, null, 2)}\n`, "utf8");
}

/** Runs the real script inside the fixture tree. */
function run(root: string, scriptName: string): { code: number; output: string } {
  const target = path.join(root, "website", "scripts", scriptName);
  copyFileSync(path.join(scriptsDir, scriptName), target);
  const result = spawnSync(process.execPath, [target], { encoding: "utf8", windowsHide: true });
  return { code: result.status ?? -1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function expectPass(result: { code: number; output: string }): void {
  expect(result.output).not.toContain("failed");
  expect(result.code, result.output).toBe(0);
}

function expectFailure(result: { code: number; output: string }, needle: string): void {
  expect(result.code, `expected a non-zero exit, got:\n${result.output}`).not.toBe(0);
  expect(result.output).toContain(needle);
}

// ---------------------------------------------------------------- data mirror

function seedMirror(root: string, { source = {}, mirror = source }: { source?: Record<string, string>; mirror?: Record<string, string> } = {}): void {
  for (const [name, body] of Object.entries(source)) write(root, `database/api/v1/${name}`, body);
  for (const [name, body] of Object.entries(mirror)) write(root, `website/public/data/v1/${name}`, body);
}

describe("verify-data-sync", () => {
  const files = { "routes.json": '{"routes":[]}\n', "crags.json": '{"crags":[]}\n' };

  it("accepts a byte-identical mirror", () => {
    const root = makeRepo();
    seedMirror(root, { source: files });
    expectPass(run(root, "verify-data-sync.mjs"));
  });

  it("rejects a mirror that is missing a generated file", () => {
    const root = makeRepo();
    seedMirror(root, { source: files, mirror: { "routes.json": files["routes.json"] } });
    expectFailure(run(root, "verify-data-sync.mjs"), "missing mirror files: crags.json");
  });

  it("rejects a mirror that has drifted from the canonical bytes", () => {
    const root = makeRepo();
    seedMirror(root, { source: files, mirror: { ...files, "crags.json": '{"crags":[{"id":"edited-by-hand"}]}\n' } });
    expectFailure(run(root, "verify-data-sync.mjs"), "content mismatches: crags.json");
  });

  it("rejects a stale extra file left behind in the mirror", () => {
    const root = makeRepo();
    seedMirror(root, { source: files, mirror: { ...files, "removed-region.json": "{}\n" } });
    expectFailure(run(root, "verify-data-sync.mjs"), "extra mirror files: removed-region.json");
  });
});

// ------------------------------------------------------------ canonical chain

type Row = { id: string };

function seedCanonical(root: string, overrides: Record<string, unknown> = {}): void {
  const routes: Row[] = [{ id: "vm-at-demo-001" }, { id: "vm-at-demo-002" }];
  const crags: Row[] = [{ id: "crag-1" }];
  const regions: Row[] = [{ id: "region-1" }];
  const counts = { routes: routes.length, crags: crags.length, regions: regions.length };
  const documents: Record<string, unknown> = {
    "database/master/vertical-moment-canonical.json": { counts, routes, crags, regions },
    "database/api/v1/routes.json": { count: counts.routes, routes },
    "database/api/v1/crags.json": { count: counts.crags, crags },
    "database/api/v1/regions.json": { count: counts.regions, regions },
    "website/public/data/v1/routes.json": { count: counts.routes, routes },
    "website/public/data/v1/crags.json": { count: counts.crags, crags },
    "website/public/data/v1/regions.json": { count: counts.regions, regions },
    "website/app/(platform)/explore/atlas-data.json": {
      routes,
      walls: crags,
      regions,
      source: { routeCount: counts.routes, wallCount: counts.crags, regionCount: counts.regions },
    },
    ...overrides,
  };
  for (const [relative, body] of Object.entries(documents)) write(root, relative, body as object);
}

describe("verify-canonical-source", () => {
  it("accepts an API, mirror and atlas that agree with canonical", () => {
    const root = makeRepo();
    seedCanonical(root);
    expectPass(run(root, "verify-canonical-source.mjs"));
  });

  it("rejects an atlas bridge that lost a route", () => {
    const root = makeRepo();
    seedCanonical(root, {
      "website/app/(platform)/explore/atlas-data.json": {
        routes: [{ id: "vm-at-demo-001" }],
        walls: [{ id: "crag-1" }],
        regions: [{ id: "region-1" }],
        source: { routeCount: 1, wallCount: 1, regionCount: 1 },
      },
    });
    expectFailure(run(root, "verify-canonical-source.mjs"), "atlas.routes.length: expected 2, received 1");
  });

  it("rejects a canonical file whose own counts block is wrong", () => {
    const root = makeRepo();
    seedCanonical(root, {
      "database/master/vertical-moment-canonical.json": {
        counts: { routes: 99, crags: 1, regions: 1 },
        routes: [{ id: "vm-at-demo-001" }, { id: "vm-at-demo-002" }],
        crags: [{ id: "crag-1" }],
        regions: [{ id: "region-1" }],
      },
    });
    expectFailure(run(root, "verify-canonical-source.mjs"), "canonical.counts.routes");
  });

  it("rejects duplicate route IDs in the published API", () => {
    const root = makeRepo();
    seedCanonical(root, { "database/api/v1/routes.json": { count: 2, routes: [{ id: "vm-at-demo-001" }, { id: "vm-at-demo-001" }] } });
    expectFailure(run(root, "verify-canonical-source.mjs"), "duplicate IDs vm-at-demo-001");
  });

  it("rejects a published route that is absent from canonical", () => {
    const root = makeRepo();
    seedCanonical(root, { "database/api/v1/routes.json": { count: 2, routes: [{ id: "vm-at-demo-001" }, { id: "vm-at-invented-999" }] } });
    expectFailure(run(root, "verify-canonical-source.mjs"), "route IDs are absent from canonical JSON");
  });
});

// ------------------------------------------------------------ content registry

function baseRegistry() {
  return {
    version: 9,
    updatedAt: "2026-08-24",
    workspace: {
      maxBoxes: 5,
      phone: { singleActive: true, primaryModuleIds: ["crag-locator"] },
      stationFocus: { approach: "crag-locator" },
    },
    background: { src: "/background.avif", alt: "Background", width: 1920, height: 1080, sizes: "100vw", sources: [] },
    introScrubSequence: {
      poster: "/poster.avif",
      chapters: [{ id: "region-rock", from: "Region", to: "Rock", alt: "Region to rock", direction: "forward", video: "/scrub.webm", duration: 4 }],
    },
    boxes: [
      {
        id: "crag-locator",
        type: "atlas",
        title: "Crag Locator",
        region: "Helenental",
        crag: "Jammerwandl",
        description: "Locator",
        initialLayout: { x: 0, y: 0, width: 4, height: 3 },
      },
    ],
    offlineData: ["/data/v1/regions.json"],
    offlinePack: ["/poster.avif"],
    heavyAssets: [],
  };
}

function seedRegistry(root: string, registry: object): void {
  write(root, "website/public/explore-content.json", registry);
  for (const asset of ["background.avif", "poster.avif", "scrub.webm", "data/v1/regions.json"]) {
    write(root, `website/public/${asset}`, "placeholder");
  }
}

describe("verify-pwa-content", () => {
  it("accepts a complete registry whose assets exist", () => {
    const root = makeRepo();
    seedRegistry(root, baseRegistry());
    expectPass(run(root, "verify-pwa-content.mjs"));
  });

  it("rejects a box that points at an asset which is not published", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.boxes[0] = { ...registry.boxes[0], image: { src: "/never-shipped.avif", alt: "Missing", width: 10, height: 10, sizes: "100vw", sources: [] } } as never;
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "/never-shipped.avif: missing public asset");
  });

  it("rejects an off-origin asset URL", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.background.src = "https://cdn.example.com/background.avif";
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "must be same-origin absolute path");
  });

  it("rejects a phone primary module that names an unknown box", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.workspace.phone.primaryModuleIds.push("box-that-was-renamed");
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "unknown box box-that-was-renamed");
  });

  it("rejects duplicate box ids", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.boxes.push({ ...registry.boxes[0] });
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "duplicate crag-locator");
  });

  it("holds the reviewed phone policy: single active module", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.workspace.phone.singleActive = false;
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "workspace.phone.singleActive: must remain true");
  });

  it("holds the reviewed workspace ceiling of five boxes", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.workspace.maxBoxes = 9;
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "must remain at or below five");
  });

  it("rejects an unsupported box type", () => {
    const root = makeRepo();
    const registry = baseRegistry();
    registry.boxes[0].type = "hologram";
    seedRegistry(root, registry);
    expectFailure(run(root, "verify-pwa-content.mjs"), "unsupported hologram");
  });
});

// --------------------------------------------------------------- pilot factory

const assetKeys = ["hero", "spatial", "topo", "model", "panoramaPoster", "panorama360", "scrubRegionRock", "scrubRockSector", "scrubSectorTopo"] as const;
const moduleKeys = ["locator", "panorama", "routes", "wall", "topo"] as const;
const videoSlots = new Set(["scrubRegionRock", "scrubRockSector", "scrubSectorTopo"]);

function makePilot(id: string) {
  const assets = Object.fromEntries(
    assetKeys.map((key) => [
      key,
      {
        kind: videoSlots.has(key) ? "video" : "image",
        status: "missing",
        targetPath: `/explore/pilots/${id}/${key}.bin`,
        src: null,
        alt: `${key} placeholder`,
      },
    ]),
  );
  return {
    schemaVersion: 1,
    id,
    label: "Jammerwandl",
    releaseState: "assembly",
    identity: { region: "Helenental", regionSlug: "helenental", crag: "Jammerwandl", cragSlug: "jammerwandl" },
    summary: { routeCount: 12 },
    journey: {
      posterSlot: "hero",
      chapters: [
        { id: "region-rock", from: "Region", to: "Rock", asset: "scrubRegionRock", duration: null, direction: "forward" },
        { id: "rock-sector", from: "Rock", to: "Sector", asset: "scrubRockSector", duration: null, direction: "forward" },
        { id: "sector-topo", from: "Sector", to: "Topo", asset: "scrubSectorTopo", duration: null, direction: "forward" },
      ],
    },
    modules: Object.fromEntries(
      moduleKeys.map((key) => [key, { title: `${key} title`, mobileLabel: key, description: `${key} description`, primarySlots: [] }]),
    ),
    assets,
  };
}

function makeRegion(pilotId: string | null) {
  return {
    schemaVersion: 1,
    id: "helenental",
    label: "Helenental",
    eyebrow: "Private preview",
    summary: "Regional preview",
    defaultNode: "jammerwandl",
    notionUrl: "https://example.invalid/helenental",
    releaseState: "private-preview",
    nodes: [
      {
        id: "jammerwandl",
        label: "Jammerwandl",
        shortLabel: "Jammer",
        role: "sector",
        relationship: "primary",
        pilotId,
        coordinate: { latitude: 48.0, longitude: 16.2 },
        media: { state: "review", availability: "private", label: "Poster", poster: "/regions/helenental/poster.avif", video: null, note: "Preview poster" },
      },
    ],
  };
}

function seedPilots(root: string, { pilot = makePilot("hel-jammerwandl"), catalog, region = makeRegion("hel-jammerwandl") }: { pilot?: object; catalog?: object; region?: object } = {}): void {
  const id = (pilot as { id: string }).id;
  write(root, "website/public/explore/pilots/index.json", catalog ?? {
    schemaVersion: 1,
    defaultPilot: id,
    pilots: [{ id, cragSlug: "jammerwandl", manifest: `/explore/pilots/${id}/pilot.json`, releaseState: "assembly" }],
  });
  write(root, `website/public/explore/pilots/${id}/pilot.json`, pilot);
  write(root, "website/public/explore/regions/index.json", { schemaVersion: 1, regions: [{ id: "helenental", manifest: "/explore/regions/helenental/region.json" }] });
  write(root, "website/public/explore/regions/helenental/region.json", region);
  write(root, "website/public/regions/helenental/poster.avif", "placeholder");
}

describe("verify-pilots", () => {
  it("accepts a catalog, manifest and region that agree", () => {
    const root = makeRepo();
    seedPilots(root);
    expectPass(run(root, "verify-pilots.mjs"));
  });

  it("rejects a manifest whose release state drifted from the catalog", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.releaseState = "ready";
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "releaseState: does not match catalog");
  });

  it("rejects a ready slot whose media file was never committed", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.assets.hero = { ...pilot.assets.hero, status: "ready", src: "/explore/pilots/hel-jammerwandl/hero.avif" } as never;
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "missing public asset /explore/pilots/hel-jammerwandl/hero.avif");
  });

  it("keeps src null while a slot is still missing", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.assets.topo = { ...pilot.assets.topo, src: "/explore/pilots/hel-jammerwandl/topo.avif" } as never;
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "must stay null until status is ready");
  });

  it("rejects a slot whose target path escapes its own pilot folder", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.assets.spatial = { ...pilot.assets.spatial, targetPath: "/explore/pilots/nasenwand/spatial.avif" } as never;
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "must live under this pilot folder");
  });

  it("rejects preview media that claims it was verified for this pilot", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.assets.hero = {
      ...pilot.assets.hero,
      preview: { adapter: "same-origin", src: "/regions/helenental/poster.avif", provenance: "Borrowed reference", verifiedForPilot: true, replaceable: true },
    } as never;
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "preview media must remain false");
  });

  it("rejects a journey that does not have exactly three chapters", () => {
    const root = makeRepo();
    const pilot = makePilot("hel-jammerwandl");
    pilot.journey.chapters.pop();
    seedPilots(root, { pilot });
    expectFailure(run(root, "verify-pilots.mjs"), "exactly three chapters required");
  });

  it("rejects a default pilot the catalog does not list", () => {
    const root = makeRepo();
    seedPilots(root, {
      catalog: {
        schemaVersion: 1,
        defaultPilot: "a-pilot-that-was-removed",
        pilots: [{ id: "hel-jammerwandl", cragSlug: "jammerwandl", manifest: "/explore/pilots/hel-jammerwandl/pilot.json", releaseState: "assembly" }],
      },
    });
    expectFailure(run(root, "verify-pilots.mjs"), "unknown pilot a-pilot-that-was-removed");
  });

  it("rejects a region node wired to a pilot that does not exist", () => {
    const root = makeRepo();
    seedPilots(root, { region: makeRegion("hel-somewhere-else") });
    expectFailure(run(root, "verify-pilots.mjs"), "pilotId: unknown hel-somewhere-else");
  });

  it("rejects a region whose default node was renamed away", () => {
    const root = makeRepo();
    const region = makeRegion("hel-jammerwandl");
    region.defaultNode = "a-node-that-moved";
    seedPilots(root, { region });
    expectFailure(run(root, "verify-pilots.mjs"), "defaultNode: unknown node a-node-that-moved");
  });
});

// ------------------------------------------------------- public/private boundary

const securePolicy = `const csp = "Content-Security-Policy default-src 'self' object-src 'none' frame-ancestors 'self' 'wasm-unsafe-eval'";\nexport default {};\n`;

function seedSecurity(root: string, options: { workflow?: string; gpxFile?: boolean; source?: string; atlas?: object; manifest?: object; nextConfig?: string } = {}): void {
  write(root, "website/next.config.mjs", options.nextConfig ?? securePolicy);
  write(root, "website/public/manifest.webmanifest", options.manifest ?? { name: "Vertical Moment", prefer_related_applications: false });
  write(root, "website/app/page.tsx", options.source ?? "export default function Page() { return null; }\n");
  write(root, "website/src/keep.ts", "export const keep = true;\n");
  write(root, "website/app/(platform)/explore/atlas-data.json", options.atlas ?? { walls: [{ id: "crag-1" }], source: { routeCount: 1 } });
  if (options.gpxFile) write(root, "website/public/atlas-gpx/track.gpx", "<gpx></gpx>");
  write(
    root,
    ".github/workflows/test.yml",
    options.workflow ?? "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5\n",
  );
}

describe("verify-security-boundaries", () => {
  it("accepts a checkout with no public GPX, a full CSP and pinned actions", () => {
    const root = makeRepo();
    seedSecurity(root);
    expectPass(run(root, "verify-security-boundaries.mjs"));
  });

  it("rejects a GPX track that reached the public tree", () => {
    const root = makeRepo();
    seedSecurity(root, { gpxFile: true });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "public GPX files found");
  });

  it("rejects source that links back to the public GPX route", () => {
    const root = makeRepo();
    seedSecurity(root, { source: 'export const track = "/atlas-gpx/helenental.gpx";\n' });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "public GPX URL reference found");
  });

  it("does not exempt a product file that reuses a fixture filename", () => {
    const root = makeRepo();
    seedSecurity(root);
    write(root, "website/app/verify-scripts.test.ts", 'export const track = "/atlas-gpx/helenental.gpx";\n');
    expectFailure(run(root, "verify-security-boundaries.mjs"), "public GPX URL reference found");
  });

  it("rejects a runtime CDN dependency", () => {
    const root = makeRepo();
    seedSecurity(root, { source: 'import "https://cdnjs.cloudflare.com/ajax/libs/thing.js";\n' });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "runtime CDN dependency found");
  });

  it("rejects an atlas bridge that leaks a gpx wall field", () => {
    const root = makeRepo();
    seedSecurity(root, { atlas: { walls: [{ id: "crag-1", gpx: "/atlas.gpx" }], source: { routeCount: 1 } } });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "still exposes a gpx wall field");
  });

  it("rejects a weakened content security policy", () => {
    const root = makeRepo();
    seedSecurity(root, { nextConfig: 'const csp = "Content-Security-Policy default-src \'self\'";\nexport default {};\n' });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "security policy is missing object-src 'none'");
  });

  it("rejects a GitHub Action pinned to a moving tag", () => {
    const root = makeRepo();
    seedSecurity(root, { workflow: "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v5\n" });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "unpinned GitHub Action actions/checkout@v5");
  });

  it("rejects a manifest that opts back into related app stores", () => {
    const root = makeRepo();
    seedSecurity(root, { manifest: { name: "Vertical Moment", prefer_related_applications: true } });
    expectFailure(run(root, "verify-security-boundaries.mjs"), "independent of related app stores");
  });
});
