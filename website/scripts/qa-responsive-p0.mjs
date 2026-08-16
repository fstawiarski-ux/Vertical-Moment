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
    const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore navigation`;
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

  const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore navigation`;
  const topRail = page.getByRole("navigation", { name: navName });
  insideViewport(await topRail.boundingBox(), viewport, `${viewport.name}: top rail`);
  const topButtons = topRail.getByRole("button");
  assert(await topButtons.count() === 6, `${viewport.name}: expected 6 top-rail controls`);

  const modules = topRail.getByRole("button", { name: "Modules" });
  await modules.click();
  const moduleTray = page.locator('section[aria-label="Explore modules"]');
  await moduleTray.waitFor({ state: "visible" });
  insideViewport(await moduleTray.boundingBox(), viewport, `${viewport.name}: Modules tray`);
  for (const title of ["Atlas", "Wall Reveal", "Routes", "Nasenwand 3D", "360"]) {
    assert(await moduleTray.getByText(title, { exact: true }).count() >= 1, `${viewport.name}: Modules tray missing ${title}`);
  }
  await page.getByRole("button", { name: "Close module menu" }).click();

  const toolsButton = page.getByRole("button", { name: "Open workspace tools" });
  insideViewport(await toolsButton.boundingBox(), viewport, `${viewport.name}: Tools control`);
  await toolsButton.click();
  const toolsPanel = page.locator('section[aria-label="Tools controls"]');
  await toolsPanel.waitFor({ state: "visible" });
  insideViewport(await toolsPanel.boundingBox(), viewport, `${viewport.name}: Tools panel`);
  assert(await toolsPanel.locator('[role="group"][aria-label="Journey"]').count() === 1, `${viewport.name}: Journey controls missing from Tools`);
  await page.getByRole("button", { name: "Close Tools controls" }).click();
}

async function assertStation(page, viewport, station) {
  const stationButton = page.getByRole("button", { name: `Fly to ${station.label}` });
  await stationButton.click();
  await page.waitForFunction(
    ({ label }) => document.querySelector(`button[aria-label="Fly to ${label}"]`)?.getAttribute("aria-current") === "step",
    { label: station.label },
  );

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
    assert(await shell.locator('article[data-mode="normal"]').count() === 1, `${viewport.name}/${station.id}: unified journey must show one normal module`);
  }

  const shellName = viewport.mode === "mobile" ? "phone" : viewport.mode;
  const activeArticle = page.locator(`[data-shell="${shellName}"] article[data-box-id="${station.moduleId}"]`);
  assert(await activeArticle.getAttribute("data-module-chrome") === "minimal", `${viewport.name}/${station.id}: minimal module chrome contract missing`);
  assert(await activeArticle.locator('[data-module-handle="true"]').isHidden(), `${viewport.name}/${station.id}: upper-left drag ornament is visible`);
  assert(await activeArticle.locator('[data-module-heading="true"]').isHidden(), `${viewport.name}/${station.id}: upper-left module description is visible`);
  assert(await activeArticle.locator('[data-module-window-controls="true"]').isHidden(), `${viewport.name}/${station.id}: normal three-button window bar is visible`);

  await assertNoHorizontalOverflow(page, viewport);
  await assertChrome(page, viewport);

  if (viewport.mode !== "mobile") {
    const article = page.locator(`[data-shell="${viewport.mode}"] article[data-mode="normal"]`);
    const articleBox = await article.boundingBox();
    const navName = `${viewport.mode === "tablet" ? "Tablet" : "Desktop"} Explore navigation`;
    const topRailBox = await page.getByRole("navigation", { name: navName }).boundingBox();
    const toolsBox = await page.getByRole("button", { name: "Open workspace tools" }).boundingBox();
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
  const article = page.locator('[data-shell="desktop"] article[data-mode="normal"]');
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

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

try {
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
      await page.goto(`${baseURL}/explore-app?intro=skip`, { waitUntil: "domcontentloaded" });
      await waitForWorkspace(page, viewport);

      for (const station of stations) {
        const filename = await assertStation(page, viewport, station);
        results.push({ viewport: viewport.name, width: viewport.width, height: viewport.height, mode: viewport.mode, station: station.id, module: station.moduleId, screenshot: filename, status: "pass" });
      }

      // Normal module chrome intentionally exposes no expand/fullscreen entry bar.
      // Exceptional persisted states retain a single escape control in the UI.
      if (viewport.mode === "desktop") {
        // Journey follow intentionally owns the compact safe-zone frame. Turn it
        // off before proving the preserved freeform desktop drag/resize contract.
        const desktopNav = page.getByRole("navigation", { name: "Desktop Explore navigation" });
        await desktopNav.getByRole("button", { name: "Journey" }).click();
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

  // Keep one explicit rollback path during owner review. It must restore the
  // previous large-screen chrome without changing phone classification.
  const rollbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const rollbackPage = await rollbackContext.newPage();
  await rollbackPage.goto(`${baseURL}/explore-app?intro=skip&responsivePreview=baseline`, { waitUntil: "domcontentloaded" });
  await rollbackPage.locator('main[data-viewport="desktop"]').waitFor({ state: "visible" });
  await rollbackPage.locator('[data-shell="desktop"][data-hierarchy="baseline"]').waitFor({ state: "visible" });
  assert(await rollbackPage.getByRole("navigation", { name: "Desktop Explore navigation" }).count() === 0, "rollback: unified top rail still rendered");
  await rollbackPage.locator('aside[aria-label="Open or restore Explore modules"]').waitFor({ state: "visible" });
  await rollbackContext.close();

  // Deep-link semantics stay unchanged: a direct module target still opens the
  // requested module without requiring the journey controls.
  const deepLinkContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
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

const finalScreenshots = results.filter((row) => row.status === "pass" && row.station !== "qa").length;
console.log(`Responsive P0 QA: ${finalScreenshots}/20 final screenshots generated.`);
if (failed || finalScreenshots !== 20) process.exitCode = 1;
