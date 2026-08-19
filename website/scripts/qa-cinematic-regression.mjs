import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const origin = (process.env.VM_PREVIEW_ORIGIN ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const outDir = path.resolve("review-artifacts/cinematic");
await fs.mkdir(outDir, { recursive: true });

const cases = [
  { id: "phone", width: 390, height: 844, shell: "phone", replay: true },
  { id: "desktop", width: 1440, height: 900, shell: "desktop", replay: false },
];

const geometry = (page) => page.locator("article").evaluateAll((nodes) => nodes.map((node) => {
  const rect = node.getBoundingClientRect();
  return {
    id: node.getAttribute("data-box-id"),
    mode: node.getAttribute("data-mode"),
    rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
  };
}));

const videoTimes = (page) => page.locator("video").evaluateAll((nodes) => nodes.map((node) => node.currentTime));
const clickAtCenter = async (page, locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("Control has no measurable hit area.");
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
};

async function setRange(slider, target) {
  await slider.evaluate((node, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("Range value setter unavailable.");
    setter.call(node, String(value));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, target);
}

async function assertMediaMoved(page, slider, target) {
  await page.waitForFunction(() => Array.from(document.querySelectorAll("video")).some((video) => video.readyState >= 1), { timeout: 20000 });
  const before = await videoTimes(page);
  await setRange(slider, target);
  await page.waitForTimeout(350);
  const after = await videoTimes(page);
  if (!after.some((value, index) => Math.abs(value - (before[index] ?? value)) > 0.04)) {
    throw new Error(`Hero media did not move when slider changed to ${target}%.`);
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const test of cases) {
  const context = await browser.newContext({ viewport: { width: test.width, height: test.height } });
  const page = await context.newPage();
  const notes = [];
  let passed = true;

  try {
    await page.goto(`${origin}/explore-app?intro=play`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const slider = page.locator("#explore-intro-timeline");
    await slider.waitFor({ state: "visible", timeout: 30000 });
    if (Number(await slider.inputValue()) > 2) throw new Error("Cinematic first visit did not begin near Region/0%.");
    await assertMediaMoved(page, slider, 46);
    notes.push("first-visit slider moves hero media");

    await setRange(slider, 100);
    await page.waitForSelector(`[data-shell="${test.shell}"]`, { timeout: 30000 });
    await page.waitForTimeout(500);
    if (!await slider.isVisible()) throw new Error("Hero slider disappeared after cinematic unlock.");

    const bodyText = await page.locator("body").innerText();
    if (/âˆ|â–|â›|Ã|�/.test(bodyText)) throw new Error("Visible mojibake/corrupt glyph text remains after unlock.");
    const visibleControls = page.locator('[data-module-window-controls="true"] button:visible');
    if (await visibleControls.count() < 1) throw new Error("No visible module window controls found.");
    if (!await visibleControls.evaluateAll((nodes) => nodes.every((node) => Boolean(node.querySelector("svg")) && !(node.textContent ?? "").trim()))) {
      throw new Error("Visible module control uses text glyph content instead of SVG.");
    }
    notes.push("window controls render as SVG without mojibake");

    if (test.shell === "desktop") {
      const controlTarget = page.locator('article[data-mode="normal"]').first();
      const controlTargetId = await controlTarget.getAttribute("data-box-id");
      if (!controlTargetId) throw new Error("Could not resolve module id for window-control behavior checks.");
      await controlTarget.hover();
      await page.waitForTimeout(120);

      const fullscreenButton = controlTarget.locator('button[aria-label$=" full screen"]').first();
      if (!await fullscreenButton.count()) throw new Error("Fullscreen control is missing on the active module.");
      await clickAtCenter(page, fullscreenButton);
      await page.locator(`article[data-box-id="${controlTargetId}"][data-mode="fullscreen"]`).waitFor({ state: "attached", timeout: 5000 });
      const exitFullscreen = page.locator(`article[data-box-id="${controlTargetId}"][data-mode="fullscreen"] button[aria-label^="Exit full screen"]`).first();
      await clickAtCenter(page, exitFullscreen);
      await page.locator(`article[data-box-id="${controlTargetId}"][data-mode="normal"]`).waitFor({ state: "attached", timeout: 5000 });

      const minimizeButton = page.locator(`article[data-box-id="${controlTargetId}"][data-mode="normal"] button[aria-label^="Hide "]`).first();
      if (!await minimizeButton.count()) throw new Error("Hide control is missing on the active module.");
      await clickAtCenter(page, minimizeButton);
      await page.waitForFunction((id) => !document.querySelector(`article[data-box-id="${id}"][data-mode="normal"]`), controlTargetId, { timeout: 5000 });
      await page.evaluate((id) => window.dispatchEvent(new CustomEvent("vm:focus-box", { detail: { id, mode: "normal" } })), controlTargetId);
      await page.locator(`article[data-box-id="${controlTargetId}"][data-mode="normal"]`).waitFor({ state: "attached", timeout: 5000 });
      notes.push("fullscreen/exit and Hide/Restore state transitions work");
    } else {
      notes.push("phone control rendering verified; shell owns touch mode transitions");
    }

    const beforeScrubGeometry = await geometry(page);
    await assertMediaMoved(page, slider, 31);
    const afterScrubGeometry = await geometry(page);
    if (JSON.stringify(beforeScrubGeometry) !== JSON.stringify(afterScrubGeometry)) throw new Error("Post-unlock scrub changed module geometry.");
    notes.push("post-unlock scrub is media-only");

    await page.evaluate(() => window.dispatchEvent(new CustomEvent("vm:preview-station-request", { detail: { station: "region" } })));
    await page.waitForTimeout(500);
    if (JSON.stringify(afterScrubGeometry) !== JSON.stringify(await geometry(page))) throw new Error("Post-unlock station request changed module geometry.");
    notes.push("post-unlock station request is choreography-safe");

    if (test.replay) {
      await page.getByRole("button", { name: "Modules" }).click();
      const replay = page.getByRole("button", { name: "Replay the Region to Topo journey" });
      await replay.waitFor({ state: "visible", timeout: 5000 });
      await replay.click();
      await page.waitForTimeout(250);
      await slider.waitFor({ state: "visible", timeout: 5000 });
      if (Number(await slider.inputValue()) > 2) throw new Error("Phone Replay Journey did not restart at Region/0%.");
      notes.push("phone Replay Journey restarts cinematic at Region");
      await setRange(slider, 100);
      await page.waitForSelector('[data-shell="phone"]', { timeout: 10000 });
      await page.waitForTimeout(400);
    }

    await page.goto(`${origin}/explore-app`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(`[data-shell="${test.shell}"]`, { timeout: 30000 });
    const returningSlider = page.locator("#explore-intro-timeline");
    await returningSlider.waitFor({ state: "visible", timeout: 10000 });
    if (Number(await returningSlider.inputValue()) < 98) throw new Error("Returning visitor did not enter at the Topo arrival state.");
    let returningGeometry = await geometry(page);
    let stableSamples = 0;

    for (let attempt = 0; attempt < 32 && stableSamples < 4; attempt += 1) {
      await page.waitForTimeout(250);
      const candidateGeometry = await geometry(page);

      if (JSON.stringify(candidateGeometry) === JSON.stringify(returningGeometry)) {
        stableSamples += 1;
      } else {
        returningGeometry = candidateGeometry;
        stableSamples = 0;
      }
    }

    if (stableSamples < 4) {
      throw new Error(
        `Returning-user module geometry did not stabilize before scrub assertion. Last geometry: ${JSON.stringify(returningGeometry)}`
      );
    }

    await assertMediaMoved(page, returningSlider, 54);

    const returningAfterGeometry = await geometry(page);

    if (JSON.stringify(returningGeometry) !== JSON.stringify(returningAfterGeometry)) {
      throw new Error(
        `Returning-user hero scrub changed module geometry. Before: ${JSON.stringify(returningGeometry)} After: ${JSON.stringify(returningAfterGeometry)}`
      );
    }

    notes.push("returning visitor skips onboarding but keeps a live media-only Hero");

    await page.screenshot({ path: path.join(outDir, `${test.id}-returning.png`), fullPage: true });
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
if (failed.length) process.exit(1);
console.log(`${results.length}/${results.length} cinematic regression cases passed.`);
