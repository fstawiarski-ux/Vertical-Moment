import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.VM_PREVIEW_URL ?? "http://127.0.0.1:3017/explore-app?intro=skip";
const outDir = path.resolve("review-artifacts/phone-tools");
await fs.mkdir(outDir, { recursive: true });

const cases = [
  { id: "portrait", width: 390, height: 844 },
  { id: "landscape", width: 844, height: 390 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function within(inner, outer, tolerance = 3) {
  return inner.x >= outer.x - tolerance
    && inner.y >= outer.y - tolerance
    && inner.x + inner.width <= outer.x + outer.width + tolerance
    && inner.y + inner.height <= outer.y + outer.height + tolerance;
}

async function openModule(page, label, id) {
  await page.getByRole("button", { name: label, exact: true }).click();
  const article = page.locator(`article[data-box-id="${id}"][data-mode="normal"]`);
  await article.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(250);
  return article;
}

async function assertTargets(locator, label) {
  const metrics = await locator.evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }).map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, text: (node.textContent ?? "").trim() };
  }));
  assert(metrics.length > 0, `${label} has no visible controls.`);
  const small = metrics.filter((item) => item.width < 44 || item.height < 44);
  assert(!small.length, `${label} contains sub-44px targets: ${small.map((item) => `${item.text || "control"} ${item.width.toFixed(0)}x${item.height.toFixed(0)}`).join(", ")}`);
}

for (const test of cases) {
  const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const notes = [];
  let passed = true;

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('section[data-shell="phone"]', { timeout: 30000 });
    await page.waitForTimeout(650);

    // Atlas: normal phone mode must fit the map and inspector inside one card.
    const atlas = await openModule(page, "Atlas", "crag-locator");
    const atlasBox = await atlas.boundingBox();
    const map = atlas.locator('[aria-label="Map of climbing regions and crags"]');
    const inspector = atlas.locator('aside[aria-label="Selected atlas content"]');
    const mapBox = await map.boundingBox();
    const inspectorBox = await inspector.boundingBox();
    assert(atlasBox && mapBox && inspectorBox, "Atlas phone surfaces are not measurable.");
    assert(within(mapBox, atlasBox), "Atlas map escapes the normal phone module frame.");
    assert(within(inspectorBox, atlasBox), "Atlas inspector escapes the normal phone module frame.");
    assert(mapBox.height >= (test.id === "portrait" ? 140 : 100), `Atlas map is too shallow (${mapBox.height.toFixed(0)}px).`);
    assert(inspectorBox.height >= 90, `Atlas inspector is too shallow (${inspectorBox.height.toFixed(0)}px).`);
    await assertTargets(atlas.locator('[role="group"][aria-label="Atlas pane size"] button'), "Atlas pane switch");
    notes.push(`Atlas fits map ${mapBox.height.toFixed(0)}px + inspector ${inspectorBox.height.toFixed(0)}px`);

    // Routes: photo is context, route list is the working surface.
    const routes = await openModule(page, "Routes", "nasenwand-spatial");
    const routesBox = await routes.boundingBox();
    const wall = routes.locator('section[aria-label="Nasenwand wall photograph"]');
    const routeDetails = routes.locator('aside[aria-label$="sector quick route list"]');
    const wallBox = await wall.boundingBox();
    const routeDetailsBox = await routeDetails.boundingBox();
    assert(routesBox && wallBox && routeDetailsBox, "Routes phone surfaces are not measurable.");
    assert(within(wallBox, routesBox), "Routes wall context escapes the normal phone module frame.");
    assert(within(routeDetailsBox, routesBox), "Routes list escapes the normal phone module frame.");
    assert(routeDetailsBox.height >= 90, `Routes working list is too shallow (${routeDetailsBox.height.toFixed(0)}px).`);
    await assertTargets(routes.locator('nav[aria-label="Nasenwand sectors"] button'), "Route sector tabs");
    const routeButtons = routes.locator('aside[aria-label$="sector quick route list"] button');
    if (await routeButtons.count()) await assertTargets(routeButtons, "Route list");
    notes.push(`Routes prioritize ${routeDetailsBox.height.toFixed(0)}px working list`);

    // Panorama: compact card keeps scale/pan/gallery controls; offline pack is a fullscreen task.
    const panorama = await openModule(page, "360", "wachau-16");
    const panoramaBox = await panorama.boundingBox();
    const scale = panorama.locator('nav[aria-label="Panorama scale"]');
    const gallery = panorama.locator('div[aria-label="Wachau panorama studies"]');
    const scaleBox = await scale.boundingBox();
    const galleryBox = await gallery.boundingBox();
    assert(panoramaBox && scaleBox && galleryBox, "Panorama phone surfaces are not measurable.");
    assert(within(scaleBox, panoramaBox), "Panorama scale controls escape the normal phone module frame.");
    assert(within(galleryBox, panoramaBox), "Panorama gallery escapes the normal phone module frame.");
    await assertTargets(scale.locator("button"), "Panorama scale tabs");
    const center = panorama.getByRole("button", { name: "Center", exact: true });
    if (await center.count()) await assertTargets(center, "Panorama center control");
    const offline = panorama.getByRole("button", { name: /offline pack|save offline|checking offline|retry offline/i });
    if (await offline.count()) assert(!(await offline.isVisible()), "Offline-pack action should not consume normal phone-card space.");
    notes.push("Panorama keeps navigation/gallery in-frame and defers offline-pack chrome");

    await page.screenshot({ path: path.join(outDir, `${test.id}.png`), fullPage: true });
  } catch (error) {
    passed = false;
    notes.push(error instanceof Error ? error.message : String(error));
    await page.screenshot({ path: path.join(outDir, `${test.id}-FAIL.png`), fullPage: true }).catch(() => {});
  }

  results.push({ ...test, passed, notes });
  console.log(`${passed ? "PASS" : "FAIL"} phone-tools-${test.id}: ${notes.join(" | ")}`);
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error(`${failed.length}/${results.length} phone tool UX cases failed.`);
  process.exit(1);
}
console.log(`${results.length}/${results.length} phone tool UX cases passed.`);
