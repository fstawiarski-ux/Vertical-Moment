import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.VM_PREVIEW_URL ?? "http://127.0.0.1:3017/explore-app?intro=skip";
const outDir = path.resolve("review-artifacts/hero-first");
await fs.mkdir(outDir, { recursive: true });

const cases = [
  { id: "phone-portrait", width: 390, height: 844, shell: "phone", maxArea: 0.23 },
  { id: "phone-landscape", width: 844, height: 390, shell: "phone", maxArea: 0.24 },
  { id: "tablet-portrait", width: 768, height: 1024, shell: "tablet", maxArea: 0.20 },
  { id: "tablet-landscape", width: 1024, height: 768, shell: "tablet", maxArea: 0.20 },
  { id: "desktop", width: 1440, height: 900, shell: "desktop", maxArea: 0.15 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

const overlaps = (a, b, gap = 1) => !(a.x + a.width + gap <= b.x || b.x + b.width + gap <= a.x || a.y + a.height + gap <= b.y || b.y + b.height + gap <= a.y);

for (const test of cases) {
  const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const notes = [];
  let passed = true;

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector(`[data-shell="${test.shell}"]`, { timeout: 30000 });
    await page.waitForTimeout(700);

    const normal = page.locator('article[data-mode="normal"]');
    if (await normal.count() < 1) throw new Error("No normal module is visible after workspace unlock.");
    const box = await normal.first().boundingBox();
    if (!box) throw new Error("Active module has no measurable frame.");
    const ratio = (box.width * box.height) / (test.width * test.height);
    if (ratio > test.maxArea) throw new Error(`Default module uses ${(ratio * 100).toFixed(1)}% of viewport area; limit is ${(test.maxArea * 100).toFixed(0)}%.`);
    notes.push(`default module ${(ratio * 100).toFixed(1)}% viewport area`);

    const timelineVisible = await page.locator('#explore-intro-timeline').isVisible().catch(() => false);
    if (timelineVisible) throw new Error("Journey timeline is still visible after unlock.");
    notes.push("journey controls detached after unlock");

    const before = await page.locator('article').evaluateAll((nodes) => nodes.map((node) => ({
      id: node.getAttribute('data-box-id'),
      mode: node.getAttribute('data-mode'),
      rect: (() => { const r = node.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })));
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("vm:preview-station-request", { detail: { station: "region" } })));
    await page.waitForTimeout(450);
    const after = await page.locator('article').evaluateAll((nodes) => nodes.map((node) => ({
      id: node.getAttribute('data-box-id'),
      mode: node.getAttribute('data-mode'),
      rect: (() => { const r = node.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })));
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("A post-unlock journey station request changed module state/geometry.");
    notes.push("post-unlock station event cannot reflow modules");

    const expand = page.locator('article[data-mode="normal"] button[aria-label^="Expand "]').first();
    if (await expand.count()) {
      await expand.click();
      await page.waitForSelector('article[data-mode="expanded"]', { timeout: 5000 });
      const expanded = await page.locator('article[data-mode="expanded"]').boundingBox();
      if (!expanded || expanded.width * expanded.height <= box.width * box.height * 1.7) throw new Error("Maximize did not materially enlarge the module.");
      const restore = page.locator('article[data-mode="expanded"] button[aria-label^="Exit expanded view"]').first();
      await restore.click();
      await page.waitForSelector('article[data-mode="normal"]', { timeout: 5000 });
      notes.push("maximize / restore works");
    } else {
      throw new Error("Normal module does not expose an Expand control.");
    }

    if (test.shell === "desktop") {
      await page.getByRole("button", { name: /Region.*Atlas/i }).click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: /Sector.*Routes/i }).click();
      await page.waitForTimeout(500);
      const frames = (await page.locator('article[data-mode="normal"]').evaluateAll((nodes) => nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { id: node.getAttribute('data-box-id'), x: r.x, y: r.y, width: r.width, height: r.height };
      })));
      if (frames.length < 2) throw new Error("Desktop module navigation did not preserve multiple open inspectors.");
      for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) {
        if (overlaps(frames[i], frames[j], 4)) throw new Error(`Desktop modules overlap: ${frames[i].id} and ${frames[j].id}.`);
      }
      const corridorLeft = test.width * 0.34;
      const corridorRight = test.width * 0.66;
      const intruders = frames.filter((frame) => frame.x < corridorRight && frame.x + frame.width > corridorLeft);
      if (intruders.length) throw new Error(`Hero centre corridor is obscured by: ${intruders.map((item) => item.id).join(", ")}.`);
      notes.push(`${frames.length} desktop inspectors open with clear centre corridor`);
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
