# Testing checklist

## Automated verification — 2026-08-08

- Production build and TypeScript: passed.
- Static route generation for `/` and `/nasenwand-concepts`: passed.
- Desktop source/implementation visual comparison: passed.
- 390 × 844 responsive layout and overflow check: passed.
- Concept selection, framing/filter states, stage drag, route-draw state, homepage navigation, and console check: passed.
- Production dependency audit (`npm audit --omit=dev`): 0 vulnerabilities after pinning the patched Nano ID transitive version.
- Full development-tool audit: 2 moderate and 1 high transitive advisory remain in the existing Wrangler/Miniflare toolchain; no new runtime package was added by this feature.

The owner-only content/provenance and merge/deployment checks below remain intentionally unchecked.

## Flagship media behaviors

- [ ] Film autoplays muted and exposes Pause and First frame controls.
- [ ] Scroll scrub remains paused and follows page scroll while Scroll link is on.
- [ ] Scroll link can be turned off; direct image dragging and the named timeline remain usable.
- [ ] Ping-pong and Story modes use the correct landscape and portrait sources.
- [ ] Animated WebP and GIF modes display without adding document overflow.
- [ ] Depth mode loads all five supplied layers and responds to the pointer.
- [ ] Reduced-motion disables autoplay, page-linked scrub, and pointer depth.
- [ ] Switching modes mounts only the selected heavy source.
- [ ] Every public media file is below Cloudflare’s 25 MiB single-asset limit.

## Build and static checks

- [ ] `npm.cmd ci` completes from `website/`.
- [ ] `npm.cmd run build` completes.
- [ ] `/nasenwand-concepts` appears as a statically rendered App Router route.
- [ ] `git diff --check` reports no whitespace errors.
- [ ] No unexpected files appear in `git status --short`.

## Three concept behaviors

- [ ] Only 01 Split Reveal, 02 Geological Wipe, and 06 Cinematic are present.
- [ ] Concept buttons and the concept slider select the same active state.
- [ ] Split Reveal divider follows drag/interaction progress.
- [ ] Geological Wipe edge remains irregular at low, middle, and high progress.
- [ ] Cinematic moves through photo, spatial, and topo/reference phases.
- [ ] Route draw is disabled in 01/02 and enabled in 06.
- [ ] Route draw visibly reveals the gold reference from bottom to top.

## Shared controls

- [ ] Wide framing restores the full stage crop.
- [ ] Detail crop remains aligned across photo, spatial, topo, and route layers.
- [ ] Monochrome applies without removing route contrast.
- [ ] Pointer movement is restrained and does not cause layout shift.
- [ ] Mouse/touch dragging works after entering and leaving the stage.
- [ ] Sliders update their visible numeric values.

## Responsive layout

- [ ] 390 × 844: title fits; numbers remain usable; stage is 4:5; controls stack; no horizontal overflow.
- [ ] 768 × 1024: stage and control deck do not collide.
- [ ] 1440 × 1100: 16:9 stage, three-column controls, and footer fit the content rail.
- [ ] Landscape phone: controls remain reachable by vertical scrolling.
- [ ] Images keep the intended focal area in wide and detail modes.

## Accessibility and resilience

- [ ] Tab reaches concept buttons, concept slider, frame buttons, interaction slider, route slider, and return link.
- [ ] Focus outline remains visible against the dark background.
- [ ] Screen-reader names describe all sliders.
- [ ] `aria-pressed` tracks active concept and frame buttons.
- [ ] Reduced-motion preference removes pointer depth and long transitions.
- [ ] Route status is understandable without relying on color.
- [ ] The page remains usable if local storage is unavailable.
- [ ] A failed/lazy image does not hide navigation or controls.

## Performance

- [ ] Source JPG/PNG/GLB masters are not present in the website diff.
- [ ] 1280 and 2400 image candidates load as expected.
- [ ] The first photo has high priority; supporting layers decode asynchronously.
- [ ] No new runtime package is added for the three image-based concepts.
- [ ] No continuous scroll listener or animation loop appears in the performance trace.
- [ ] Any future GLB is served from R2 and loaded on intent.

## Content and provenance

- [ ] Photo usage rights are confirmed.
- [ ] Topo/reference usage is confirmed.
- [ ] Provisional route wording is still visible.
- [ ] No route name, grade, length, bolt count, or access statement is presented as verified without approval.
- [ ] Camera registration is reviewed before claiming photo-to-model alignment.

## Pre-PR review

- [ ] Review every staged path against `docs/nasenwand-concepts/COPY_MAP.md`.
- [ ] Review desktop and phone screenshots.
- [ ] Confirm `main` has not been changed directly.
- [ ] Confirm no deployment or production cutover is bundled with the PR.
- [ ] Confirm the PR description names the provisional-data and full-GLB exclusions.
