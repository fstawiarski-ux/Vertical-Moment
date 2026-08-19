import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = path.resolve(process.cwd(), "review-artifacts/p0-responsive");
await mkdir(outputDir, { recursive: true });

const viewports = [
  { name: "phone-portrait", width: 390, height: 844, mode: "mobile" },
  { name: "phone-landscape", width: 844, height: 390, mode: "mobile" },
  { name: "tablet-portrait", width: 768, height: 1024, mode: "tablet" },
  { name: "tablet-landscape", width: 1024, height: 768, mode: "tablet" },
  { name: "desktop", width: 1440, height: 900, mode: "desktop" },
];

const stations = [
  { id: "region", label: "Region", moduleId: "crag-locator", title: "Crag Locator" },
  { id: "rock", label: "Rock", moduleId: "wall-reveal", title: "Wall Reveal" },
  { id: "sector", label: "Sector", moduleId: "nasenwand-spatial", title: "Nasenwand Routes" },
  { id: "topo", label: "Topo", moduleId: "nasenwand-model", title: "Nasenwand 3D" },
];

const moduleReviews = [
  { id: "atlas", boxId: "crag-locator", open: "crag-locator" },
  { id: "routes", boxId: "nasenwand-spatial", open: "nasenwand-routes" },
  { id: "panorama", boxId: "wachau-16", open: "wachau-panorama" },
  { id: "topo", boxId: "nasenwand-model", open: "nasenwand-3d" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function insideViewport(box, viewport, label) {
  assert(box, `${label} has no bounding box`);
  assert(box.x >= -1, `${label} clips left (${box.x})`);
  assert(box.y >= -1, `${label} clips top (${box.y})`);
  assert(box.x + box.width <= viewport.width + 1, `${label} clips right (${box.x + box.width} > ${viewport.width})`);
  assert(box.y + box.height <= viewport.height + 1, `${label} clips bottom (${box.y + box.height} > ${viewport.height})`);
}

async function assertNoHorizontalOverflow(page, viewport) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(metrics.innerWidth === viewport.width, `innerWidth ${metrics.innerWidth} != ${viewport.width}`);
  assert(metrics.docScrollWidth <= viewport.width + 1, `document horizontal overflow ${metrics.docScrollWidth} > ${viewport.width}`);
  assert(metrics.bodyScrollWidth <= viewport.width + 1, `body horizontal overflow ${metrics.bodyScrollWidth} > ${viewport.width}`);
}

async function waitForWorkspace(page, viewport) {
  await page.locator(`main[data-viewport="${viewport.mode}"]`).waitFor({ state: "visible" });
  await page.locator('[aria-label="Wachau approach scrub sequence"][data-unlocked="true"]').waitFor({ state: "visible" });

  if (viewport.mode === "mobile") {
    const phone = page.locator('[data-shell="phone"]');
    await phone.waitFor({ state: "visible" });
    assert(await phone.getAttribute("data-single-active") === "true", `${viewport.name}: phone single-active contract missing`);
    assert(await page.locator('[data-shell="tablet"], [data-shell="desktop"]').count() === 0, `${viewport.name}: non-phone shell rendered`);
    assert(await page.locator('[aria-label="Explore workspace controls"]').count() === 0, `${viewport.name}: desktop/tablet Tools rail rendered on phone`);
  } else {
    const shell = page.locator(`[data-shell="${viewport.mode}"]`);
    await shell.waitFor({ state: "visible" });
    assert(await shell.getAttribute("data-hierarchy") === "phone-inspired", `${viewport.name}: unified hierarchy is not default`);
    const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore journey`;
    await page.getByRole("navigation", { name: navName }).waitFor({ state: "visible" });
    await page.getByRole("navigation", { name: "Explore workspace controls" }).waitFor({ state: "visible" });
  }
}

async function assertChrome(page, viewport) {
  const slider = page.getByRole("slider", { name: "Move from Region on the left to Topo on the right" });
  insideViewport(await slider.boundingBox(), viewport, `${viewport.name}: bottom scrub rail`);

  if (viewport.mode === "mobile") {
    const nav = page.getByRole("navigation", { name: "Phone workspace navigation" });
    insideViewport(await nav.boundingBox(), viewport, `${viewport.name}: phone navigation`);
    return;
  }

  const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore journey`;
  const topRail = page.getByRole("navigation", { name: navName });
  const topRailBox = await topRail.boundingBox();
  insideViewport(topRailBox, viewport, `${viewport.name}: top rail`);
  assert(topRailBox && topRailBox.x <= 1 && topRailBox.x + topRailBox.width >= viewport.width - 1, `${viewport.name}: top rail is not edge-to-edge`);
  const topButtons = topRail.getByRole("button");
  assert(await topButtons.count() === 5, `${viewport.name}: expected 5 V4 top-rail controls`);

  const workspaceControls = page.getByRole("navigation", { name: "Explore workspace controls" });
  insideViewport(await workspaceControls.boundingBox(), viewport, `${viewport.name}: persistent workspace rail`);
  const moduleButtons = workspaceControls.locator('button[aria-label$=" module"]');
  assert(await moduleButtons.count() === 5, `${viewport.name}: expected 5 persistent module controls`);
  for (const label of ["Atlas", "Routes", "360", "3D", "Wall"]) {
    assert(
      await workspaceControls.getByRole("button", { name: new RegExp(`${label} module$`) }).count() === 1,
      `${viewport.name}: persistent module rail missing ${label}`,
    );
  }

  const toolsButton = page.getByRole("button", { name: "Tools", exact: true });
  insideViewport(await toolsButton.boundingBox(), viewport, `${viewport.name}: Tools control`);
  await toolsButton.click();
  const toolsPanel = page.locator('section[aria-label="Tools controls"]');
  await toolsPanel.waitFor({ state: "visible" });
  insideViewport(await toolsPanel.boundingBox(), viewport, `${viewport.name}: Tools panel`);
  assert(await toolsPanel.locator('[role="group"][aria-label^="Journey"]').count() === 1, `${viewport.name}: Journey controls missing from Tools`);
  await page.getByRole("button", { name: "Close Tools controls" }).click();
}

async function assertStation(page, viewport, station) {
  if (viewport.mode === "mobile") {
    const phone = page.locator('[data-shell="phone"]');
    const directPhoneLabels = { region: "Atlas", sector: "Routes" };
    const directLabel = directPhoneLabels[station.id];
    if (directLabel) {
      await phone.getByRole("button", { name: directLabel, exact: true }).click();
    } else {
      await phone.getByRole("button", { name: "Modules", exact: true }).click();
      await phone.locator('[data-role="phone-more"]').getByRole("button", { name: station.title, exact: true }).click();
    }
  } else {
    const stationButton = page
      .getByRole("navigation", { name: `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore journey` })
      .getByRole("button", { name: new RegExp(`^${station.label}\\b`) });
    await stationButton.click();
  }

  if (viewport.mode === "mobile") {
    const phone = page.locator('[data-shell="phone"]');
    await page.waitForFunction(
      ({ moduleId }) => document.querySelector('[data-shell="phone"]')?.getAttribute("data-active-box") === moduleId,
      { moduleId: station.moduleId },
    );
    assert(await phone.locator("article").count() === 1, `${viewport.name}/${station.id}: phone must render exactly one article`);
  } else {
    const shell = page.locator(`[data-shell="${viewport.mode}"]`);
    await shell.locator(`article[data-mode="normal"][data-box-id="${station.moduleId}"]`).waitFor({ state: "visible" });
    assert(
      await shell.locator('article[data-mode="normal"]').count() >= 1,
      `${viewport.name}/${station.id}: journey stage must show at least one normal module`,
    );
  }

  const shellName = viewport.mode === "mobile" ? "phone" : viewport.mode;
  const activeArticle = page.locator(`[data-shell="${shellName}"] article[data-box-id="${station.moduleId}"]`);
  assert(await activeArticle.getAttribute("data-module-chrome") === "minimal", `${viewport.name}/${station.id}: minimal module chrome contract missing`);
  assert(await activeArticle.locator('[data-module-handle="true"]').isHidden(), `${viewport.name}/${station.id}: upper-left drag ornament is visible`);
  assert(await activeArticle.locator('[data-module-heading="true"]').isHidden(), `${viewport.name}/${station.id}: upper-left module description is visible`);
  const controlsState = await activeArticle.evaluate((node) => {
    const controls = node.querySelector('[data-module-window-controls="true"]');
    if (!controls) return null;
    const style = getComputedStyle(controls);
    return { display: style.display, opacity: style.opacity, pointerEvents: style.pointerEvents };
  });
  const controlsRevealed = await activeArticle.getAttribute("data-controls-visible") === "true";
  assert(
    controlsState && (controlsRevealed || controlsState.display === "none" || controlsState.opacity === "0" || controlsState.pointerEvents === "none"),
    `${viewport.name}/${station.id}: normal window controls are not interaction-revealed`,
  );

  if (viewport.mode !== "mobile") {
    await activeArticle.hover();
    await page.waitForFunction(({ shellName, moduleId }) => {
      const controls = document.querySelector(`[data-shell="${shellName}"] article[data-box-id="${moduleId}"] [data-module-window-controls="true"]`);
      if (!controls) return false;
      const style = getComputedStyle(controls);
      return style.opacity !== "0" && style.pointerEvents === "auto";
    }, { shellName, moduleId: station.moduleId });
    await page.mouse.move(4, 4);
  }

  await assertNoHorizontalOverflow(page, viewport);
  await assertChrome(page, viewport);

  if (viewport.mode !== "mobile") {
    const article = activeArticle;
    const articleBox = await article.boundingBox();
    const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore journey`;
    const topRailBox = await page.getByRole("navigation", { name: navName }).boundingBox();
    const workspaceControls = page.getByRole("navigation", { name: "Explore workspace controls" });
    const toolsBox = await workspaceControls.boundingBox();
    const sliderBox = await page.getByRole("slider", { name: "Move from Region on the left to Topo on the right" }).boundingBox();
    assert(articleBox && topRailBox && toolsBox && sliderBox, `${viewport.name}: model safe-zone geometry unavailable`);
    assert(articleBox.y >= topRailBox.y + topRailBox.height, `${viewport.name}: model overlaps top rail`);
    assert(articleBox.x + articleBox.width <= toolsBox.x, `${viewport.name}: model overlaps Tools safe zone`);
    assert(articleBox.y + articleBox.height <= sliderBox.y, `${viewport.name}: model overlaps bottom scrub rail`);
  }

  const filename = `p0-final-${viewport.name}-${station.id}.png`;
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
  return filename;
}

async function assertDesktopDragResize(page) {
  const article = page.locator('[data-shell="desktop"] article[data-mode="normal"][data-box-id="nasenwand-model"]');
  const title = "Nasenwand 3D";
  const beforeDrag = await article.boundingBox();
  assert(beforeDrag, "desktop: active module has no initial geometry");
  const dragSurface = article.locator('[data-drag-surface="true"]');
  const dragBox = await dragSurface.boundingBox();
  assert(dragBox, "desktop: invisible drag surface has no geometry");
  await page.mouse.move(dragBox.x + Math.min(80, dragBox.width / 2), dragBox.y + Math.max(2, dragBox.height / 2));
  await page.mouse.down();
  await page.mouse.move(dragBox.x + Math.min(80, dragBox.width / 2) + 48, dragBox.y + Math.max(2, dragBox.height / 2) + 24, { steps: 5 });
  await page.mouse.up();
  const afterDrag = await article.boundingBox();
  assert(afterDrag, "desktop: active module geometry missing after drag");
  assert(Math.abs(afterDrag.x - beforeDrag.x) >= 10 || Math.abs(afterDrag.y - beforeDrag.y) >= 10, "desktop: drag did not move module");

  for (const direction of ["n", "ne", "e", "se", "s", "sw", "w", "nw"]) {
    assert(await page.getByRole("button", { name: `Resize ${title} from ${direction}`, exact: true }).count() === 1, `desktop: missing ${direction} resize handle`);
  }

  const resize = page.getByRole("button", { name: `Resize ${title} from se`, exact: true });
  const resizeBox = await resize.boundingBox();
  assert(resizeBox, "desktop: southeast resize handle missing");
  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeBox.x + resizeBox.width / 2 + 44, resizeBox.y + resizeBox.height / 2 + 32, { steps: 5 });
  await page.mouse.up();
  const afterResize = await article.boundingBox();
  assert(afterResize, "desktop: active module geometry missing after resize");
  assert(afterResize.width > afterDrag.width + 10 || afterResize.height > afterDrag.height + 10, "desktop: southeast resize did not change module size");
  await assertNoHorizontalOverflow(page, viewports.at(-1));
}

async function captureModuleReview(page, viewport, review) {
  await page.goto(`${baseURL}/explore-app?intro=skip&open=${review.open}&mode=expanded`, { waitUntil: "domcontentloaded" });
  await waitForWorkspace(page, viewport);
  const shell = page.locator(`[data-shell="${viewport.mode === "mobile" ? "phone" : viewport.mode}"]`);
  const article = shell.locator(`article[data-box-id="${review.boxId}"][data-mode="expanded"]`);
  await article.waitFor({ state: "visible" });
  await assertNoHorizontalOverflow(page, viewport);
  const filename = `module-${viewport.name}-${review.id}.png`;
  if (review.id === "atlas") {
    const openAtlas = article.getByRole("button", { name: "Open the Atlas", exact: true });
    if (await openAtlas.count()) await openAtlas.click();
    await article.locator("select").waitFor({ state: "attached" });
    const layerOptions = article.locator('select option');
    const labels = await layerOptions.allTextContents();
    for (const label of ["Terrain", "Satellite", "Leaflet", "Google Maps"]) {
      assert(labels.includes(label), `${viewport.name}/atlas: missing ${label} map layer`);
    }
    assert(await article.locator('[role="separator"][aria-label="Resize Atlas map and inspector"]').count() === 1, `${viewport.name}/atlas: split resize handle missing`);
    assert(await article.locator('aside[aria-label="Selected atlas content"] input[type="search"]').count() === 1, `${viewport.name}/atlas: inspector search missing`);
  }
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
  return filename;
}

async function assertModeChainPersistenceViewport(browser) {
  const desktop = viewports.find((viewport) => viewport.name === "desktop");
  const tablet = viewports.find((viewport) => viewport.name === "tablet-landscape");
  assert(desktop && tablet, "mode/persistence: required desktop and tablet viewports missing");

  const context = await browser.newContext({
    viewport: { width: desktop.width, height: desktop.height },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/explore-app?intro=skip&open=nasenwand-3d&mode=normal`, { waitUntil: "domcontentloaded" });
    await waitForWorkspace(page, desktop);
    const article = page.locator('[data-shell="desktop"] article[data-box-id="nasenwand-model"]');
    await article.waitFor({ state: "visible" });
    await page.waitForTimeout(350);
    const initial = await article.boundingBox();
    assert(initial, "mode/persistence: initial 3D frame missing");

    await page.goto(`${baseURL}/explore-app?intro=skip&open=nasenwand-3d&mode=expanded`, { waitUntil: "domcontentloaded" });
    await waitForWorkspace(page, desktop);
    const expanded = page.locator('[data-shell="desktop"] article[data-box-id="nasenwand-model"][data-mode="expanded"]');
    await expanded.waitFor({ state: "visible" });
    await expanded.getByRole("button", { name: "Open Nasenwand 3D full screen", exact: true }).click();
    const fullscreen = page.locator('[data-shell="desktop"] article[data-box-id="nasenwand-model"][data-mode="fullscreen"]');
    await fullscreen.waitFor({ state: "visible" });
    await fullscreen.getByRole("button", { name: "Return to expanded view Nasenwand 3D", exact: true }).click();
    await expanded.waitFor({ state: "visible" });
    await expanded.getByRole("button", { name: "Exit expanded view Nasenwand 3D", exact: true }).click();
    await article.waitFor({ state: "visible" });
    await page.waitForTimeout(350);
    const restored = await article.boundingBox();
    assert(restored, "mode/persistence: restored normal frame missing");
    assert(Math.abs(restored.x - initial.x) <= 1 && Math.abs(restored.y - initial.y) <= 1, "mode/persistence: mode chain changed the saved frame");

    await assertDesktopDragResize(page);
    const moved = await article.boundingBox();
    assert(moved, "mode/persistence: moved frame missing");
    await page.waitForTimeout(900);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForWorkspace(page, desktop);
    await page.waitForTimeout(500);
    const reloaded = await article.boundingBox();
    assert(reloaded, "mode/persistence: reloaded frame missing");
    assert(Math.abs(reloaded.x - moved.x) <= 2 && Math.abs(reloaded.y - moved.y) <= 2, "mode/persistence: moved frame did not persist after reload");

    await page.setViewportSize({ width: tablet.width, height: tablet.height });
    await page.locator('main[data-viewport="tablet"]').waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, tablet);
    await page.setViewportSize({ width: desktop.width, height: desktop.height });
    await page.locator('main[data-viewport="desktop"]').waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, desktop);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];
const browserGates = [];
let failed = false;

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
      hasTouch: viewport.mode !== "desktop",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    try {
      await page.goto(`${baseURL}/explore-app?intro=skip`, { waitUntil: "domcontentloaded" });
      await waitForWorkspace(page, viewport);

      for (const station of stations) {
        const filename = await assertStation(page, viewport, station);
        results.push({ viewport: viewport.name, width: viewport.width, height: viewport.height, mode: viewport.mode, station: station.id, module: station.moduleId, screenshot: filename, status: "pass" });
      }

      // Normal module chrome intentionally exposes no expand/fullscreen entry bar.
      // Exceptional persisted states retain a single escape control in the UI.
      if (viewport.mode === "desktop") {
        // Spatial Focus V4 intentionally locks the reviewed Topo arrival.
        // Unlock before proving that preserved desktop freeform drag/resize still works.
        const unlockLayout = page.locator('nav[aria-label="Explore workspace controls"] button[title="Unlock layout"]');
        if (await unlockLayout.count() === 1) await unlockLayout.click();
        // The reviewed Topo arrival intentionally packs four normal modules.
        // Isolate the 3D module before testing freeform movement so the
        // collision-avoidance contract is not what prevents the drag.
        const workspaceControls = page.getByRole("navigation", { name: "Explore workspace controls" });
        await workspaceControls.getByRole("button", { name: "Tools", exact: true }).click();
        const toolsPanel = page.locator('section[aria-label="Tools controls"]');
        await toolsPanel.waitFor({ state: "visible" });
        const minimizeAll = toolsPanel.getByRole("button", { name: "Minimize all modules", exact: true });
        assert(await minimizeAll.count() === 1, "desktop: Minimize all modules control missing from Tools");
        await minimizeAll.evaluate((button) => button.click());

        const openModel = workspaceControls.getByRole("button", { name: "Open 3D module", exact: true });
        await openModel.waitFor({ state: "visible" });
        await openModel.click();
        await page
          .locator('[data-shell="desktop"] article[data-mode="normal"][data-box-id="nasenwand-model"]')
          .waitFor({ state: "visible" });

        await assertDesktopDragResize(page);
      }

      assert(errors.length === 0, `${viewport.name}: browser errors:\n${errors.join("\n")}`);
    } catch (error) {
      failed = true;
      results.push({ viewport: viewport.name, width: viewport.width, height: viewport.height, mode: viewport.mode, station: "qa", module: "n/a", screenshot: "", status: "fail", error: error instanceof Error ? error.stack ?? error.message : String(error) });
    } finally {
      await context.close();
    }
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
      hasTouch: viewport.mode !== "desktop",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    try {
      for (const review of moduleReviews) {
        const filename = await captureModuleReview(page, viewport, review);
        results.push({ viewport: viewport.name, width: viewport.width, height: viewport.height, mode: viewport.mode, station: "review", module: review.id, screenshot: filename, status: "pass" });
      }
      assert(errors.length === 0, `${viewport.name}: module review browser errors:\n${errors.join("\n")}`);
    } catch (error) {
      failed = true;
      results.push({ viewport: viewport.name, width: viewport.width, height: viewport.height, mode: viewport.mode, station: "review", module: "n/a", screenshot: "", status: "fail", error: error instanceof Error ? error.stack ?? error.message : String(error) });
    } finally {
      await context.close();
    }
  }

  try {
    await assertModeChainPersistenceViewport(browser);
    browserGates.push({ id: "mode-chain-persistence", status: "pass" });
  } catch (error) {
    failed = true;
    browserGates.push({ id: "mode-chain-persistence", status: "fail", error: error instanceof Error ? error.stack ?? error.message : String(error) });
  }

  // Keep one explicit rollback path during owner review. It must restore the
  // previous large-screen chrome without changing phone classification.
  const rollbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", serviceWorkers: "block" });
  const rollbackPage = await rollbackContext.newPage();
  await rollbackPage.goto(`${baseURL}/explore-app?intro=skip&responsivePreview=baseline`, { waitUntil: "domcontentloaded" });
  await rollbackPage.locator('main[data-viewport="desktop"]').waitFor({ state: "visible" });
  await rollbackPage.locator('[data-shell="desktop"][data-hierarchy="baseline"]').waitFor({ state: "visible" });
  assert(await rollbackPage.getByRole("navigation", { name: "Desktop Explore journey" }).count() === 0, "rollback: unified top rail still rendered");
  await rollbackPage.locator('aside[aria-label="Open or restore Explore modules"]').waitFor({ state: "visible" });
  await rollbackContext.close();

  // Deep-link semantics stay unchanged: a direct module target still opens the
  // requested module without requiring the journey controls.
  const deepLinkContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", serviceWorkers: "block" });
  const deepLinkPage = await deepLinkContext.newPage();
  await deepLinkPage.goto(`${baseURL}/explore-app?intro=skip&mode=normal&open=wall-reveal`, { waitUntil: "domcontentloaded" });
  await deepLinkPage.locator('main[data-viewport="desktop"]').waitFor({ state: "visible" });
  const deepLinkedModule = deepLinkPage.locator('[data-shell="desktop"] article[data-box-id="wall-reveal"][data-mode="normal"]');
  await deepLinkedModule.waitFor({ state: "visible" });
  assert(await deepLinkedModule.getAttribute("data-module-chrome") === "minimal", "deep link: minimal module chrome contract missing");
  assert(new URL(deepLinkPage.url()).searchParams.get("open") === "wall-reveal", "deep link: open target changed unexpectedly");
  await deepLinkContext.close();
} finally {
  await browser.close();
}

const csvHeader = ["viewport", "width", "height", "mode", "station", "module", "screenshot", "status", "error"];
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const csv = [csvHeader.join(","), ...results.map((row) => csvHeader.map((key) => escapeCsv(row[key])).join(","))].join("\n") + "\n";
await writeFile(path.join(outputDir, "matrix.csv"), csv, "utf8");
await writeFile(path.join(outputDir, "results.json"), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), results }, null, 2) + "\n", "utf8");
await writeFile(path.join(outputDir, "browser-gates.json"), JSON.stringify({ baseURL, generatedAt: new Date().toISOString(), gates: browserGates }, null, 2) + "\n", "utf8");

const finalScreenshots = results.filter((row) => row.status === "pass" && row.station !== "qa").length;
console.log(`Responsive P0 QA: ${finalScreenshots}/40 final screenshots generated.`);
if (failed || finalScreenshots !== 40 || browserGates.some((gate) => gate.status !== "pass")) process.exitCode = 1;
