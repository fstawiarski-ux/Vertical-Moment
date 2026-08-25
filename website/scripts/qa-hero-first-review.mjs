import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.VM_PREVIEW_URL ?? "http://127.0.0.1:3017/explore-app?intro=skip";
const outDir = path.resolve("review-artifacts/hero-first");
await fs.mkdir(outDir, { recursive: true });

// Phone and desktop are the only canonical Explore products in this suite.
const cases = [
  { id: "phone-portrait", width: 390, height: 844, shell: "phone", minArea: 0.34, maxArea: 0.50, nav: "bottom" },
  { id: "phone-landscape", width: 844, height: 390, shell: "phone", minArea: 0.30, maxArea: 0.46, nav: "right" },
  { id: "desktop", width: 1440, height: 900, shell: "desktop", minArea: 0, maxArea: 0.15, nav: null },
];

const browser = await chromium.launch({ headless: true });
const results = [];

const clickAtCenter = async (page, locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("Control has no measurable hit area.");
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
};

for (const test of cases) {
  const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const notes = [];
  let passed = true;

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(`[data-shell="${test.shell}"]`, { timeout: 30000 });
    await page.waitForTimeout(700);

    const normal = page.locator('article[data-mode="normal"]');
    if (await normal.count() < 1) throw new Error("No normal module is visible after workspace unlock.");
    const box = await normal.first().boundingBox();
    if (!box) throw new Error("Active module has no measurable frame.");
    const ratio = (box.width * box.height) / (test.width * test.height);
    if (ratio < test.minArea || ratio > test.maxArea) {
      throw new Error(`Default module uses ${(ratio * 100).toFixed(1)}% of viewport area; expected ${(test.minArea * 100).toFixed(0)}-${(test.maxArea * 100).toFixed(0)}%.`);
    }
    notes.push(`default module ${(ratio * 100).toFixed(1)}% viewport area`);

    const bodyText = await page.locator("body").innerText();
    if (/âˆ|â–|â›|Ã|�/.test(bodyText)) throw new Error("Visible mojibake/corrupt glyph text remains in the Explore shell.");
    notes.push("visible shell text is free of known mojibake signatures");

    const timeline = page.locator("#explore-intro-timeline");
    if (!(await timeline.isVisible().catch(() => false))) throw new Error("Hero scrub is missing after workspace unlock.");
    notes.push("compact hero scrub remains reachable after unlock");

    if (test.shell === "phone") {
      const phoneModule = normal.first();
      if (await phoneModule.getAttribute("data-module-chrome") !== "minimal") throw new Error("Phone module chrome is not minimal.");
      if (await phoneModule.locator('[data-module-window-controls="true"]').count()) throw new Error("Phone station card exposes desktop window controls.");

      const nav = page.locator('[data-role="phone-nav"]');
      const navBox = await nav.boundingBox();
      if (!navBox) throw new Error("Phone navigation has no measurable frame.");
      if (test.nav === "bottom" && navBox.y < test.height * 0.70) throw new Error(`Portrait phone navigation is not bottom anchored (y=${navBox.y.toFixed(0)}).`);
      if (test.nav === "right" && navBox.x < test.width * 0.75) throw new Error(`Landscape phone navigation is not right anchored (x=${navBox.x.toFixed(0)}).`);
      const navMetrics = await nav.locator("button").evaluateAll((nodes) => nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { width: rect.width, height: rect.height, family: style.fontFamily, size: parseFloat(style.fontSize) };
      }));
      if (navMetrics.some((metric) => metric.width < 44 || metric.height < 44)) throw new Error("A phone navigation target is smaller than 44x44px.");
      if (navMetrics.some((metric) => /Arial/i.test(metric.family) || metric.size < 11)) throw new Error("Phone navigation typography regressed.");

      const activeId = await normal.first().getAttribute("data-box-id");
      if (!activeId) throw new Error("Phone active module is missing its id.");
      if (await page.locator('article[data-mode="normal"]').count() !== 1) throw new Error("Phone station stage must expose exactly one normal module.");
      notes.push("phone uses one minimal station card with no window controls");
      notes.push(test.nav === "bottom" ? "portrait navigation is bottom anchored" : "landscape navigation uses the right rail");
    } else {
      const controlButtons = page.locator('[data-module-window-controls="true"] button:visible');
      const controlsUseSvg = await controlButtons.evaluateAll((nodes) => nodes.every((node) => Boolean(node.querySelector("svg")) && !(node.textContent ?? "").trim()));
      if (!controlsUseSvg) throw new Error("A visible module window control still relies on text glyph content instead of SVG.");
      if (await controlButtons.count() < 3) throw new Error("Desktop three-action module window control contract is incomplete.");
      const controlLabels = await controlButtons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
      if (!controlLabels.some((label) => label?.startsWith("Hide ")) || !controlLabels.some((label) => label?.endsWith(" full screen")) || !controlLabels.some((label) => label?.startsWith("Move "))) {
        throw new Error(`Desktop module controls do not expose Hide, Full screen, and Move: ${controlLabels.join(", ")}`);
      }
      notes.push("desktop keeps Hide, Full screen, and Move controls");
    }

    const visibleHeadingFamilies = await page.locator('[data-module-heading="true"] h2:visible').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fontFamily));
    if (visibleHeadingFamilies.some((family) => /Arial/i.test(family))) throw new Error("A visible module heading still uses the legacy Arial override.");

    const before = await page.locator("article").evaluateAll((nodes) => nodes.map((node) => ({
      id: node.getAttribute("data-box-id"),
      mode: node.getAttribute("data-mode"),
      rect: (() => { const r = node.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })));
    await page.waitForFunction(() => Array.from(document.querySelectorAll("video")).some((video) => video.readyState >= 1), { timeout: 20000 }).catch(() => {});
    const videoTimesBefore = await page.locator("video").evaluateAll((nodes) => nodes.map((node) => node.currentTime));
    await timeline.evaluate((node) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (!setter) throw new Error("Range value setter unavailable.");
      setter.call(node, "37");
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(350);
    const videoTimesAfter = await page.locator("video").evaluateAll((nodes) => nodes.map((node) => node.currentTime));
    if (!videoTimesAfter.some((value, index) => Math.abs(value - (videoTimesBefore[index] ?? value)) > 0.04)) throw new Error("Post-unlock hero slider did not move scrub media.");
    const afterScrub = await page.locator("article").evaluateAll((nodes) => nodes.map((node) => ({
      id: node.getAttribute("data-box-id"),
      mode: node.getAttribute("data-mode"),
      rect: (() => { const r = node.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })));
    if (JSON.stringify(before) !== JSON.stringify(afterScrub)) throw new Error("Post-unlock hero scrub changed module state/geometry.");
    notes.push("post-unlock scrub moves media without reflowing modules");

    await page.evaluate(() => window.dispatchEvent(new CustomEvent("vm:preview-station-request", { detail: { station: "region" } })));
    await page.waitForTimeout(450);
    const afterStationRequest = await page.locator("article").evaluateAll((nodes) => nodes.map((node) => ({
      id: node.getAttribute("data-box-id"),
      mode: node.getAttribute("data-mode"),
      rect: (() => { const r = node.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })));
    if (JSON.stringify(afterScrub) !== JSON.stringify(afterStationRequest)) throw new Error("A post-unlock journey station request changed module state/geometry.");
    notes.push("post-unlock station event cannot reflow modules");

    if (test.shell === "desktop") {
      const controlTarget = page.locator('article[data-mode="normal"]').first();
      const controlTargetId = await controlTarget.getAttribute("data-box-id");
      await controlTarget.hover();
      await page.waitForTimeout(120);
      const hide = controlTarget.locator('button[aria-label^="Hide "]').first();
      if (!controlTargetId || !(await hide.count())) throw new Error("Hide control is missing on the active desktop module.");
      await clickAtCenter(page, hide);
      await page.waitForFunction((id) => !document.querySelector(`article[data-box-id="${id}"][data-mode="normal"]`), controlTargetId, { timeout: 5000 });
      await page.evaluate((id) => window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } })), controlTargetId);
      await page.locator(`article[data-box-id="${controlTargetId}"][data-mode="normal"]`).waitFor({ state: "attached", timeout: 5000 });
      notes.push("desktop Hide / restore remains functional");

      await page.getByRole("button", { name: /Region.*Atlas/i }).click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: /Sector.*Routes/i }).click();
      await page.waitForTimeout(500);
      const frames = await page.locator('article[data-mode="normal"]').evaluateAll((nodes) => nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { id: node.getAttribute("data-box-id"), x: r.x, y: r.y, width: r.width, height: r.height };
      }));
      if (frames.length !== 1) throw new Error(`Desktop station navigation must show exactly one inspector; found ${frames.length}.`);
      if (frames[0].id !== "nasenwand-spatial") throw new Error(`Desktop station navigation did not select the Sector card: ${frames[0].id ?? "unknown"}.`);
      notes.push("desktop station navigation keeps exactly one mapped inspector visible");
    }

    await page.screenshot({ path: path.join(outDir, `${test.id}.png`), fullPage: true });
  } catch (error) {
    passed = false;
    notes.push(error instanceof Error ? error.message : String(error));
    await page.screenshot({ path: path.join(outDir, `${test.id}-FAIL.png`), fullPage: true }).catch(() => {});
  }

  results.push({ ...test, passed, notes });
  console.log(`${passed ? "PASS" : "FAIL"} ${test.id}: ${notes.join(" | ")}`);
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error(`${failed.length}/${results.length} hero-first cases failed.`);
  process.exit(1);
}
console.log(`${results.length}/${results.length} hero-first cases passed.`);
