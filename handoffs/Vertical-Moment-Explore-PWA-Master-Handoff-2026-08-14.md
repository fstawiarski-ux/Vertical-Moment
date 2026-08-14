# Vertical Moment Explore PWA — Master Handoff

Date: 2026-08-14
Owner: Vertical Moment / fstawiarski-ux
Repository: `https://github.com/fstawiarski-ux/Vertical-Moment`
Review branch: `pwa/explore-layout-2026-08-14`
Base branch: `main`
Current code commit: `ca523cc318744b08889eb1e91979124f39f00e6d` (`fix(pwa): harden desktop box resizing`)

## Current state

This is the private Explore / Climbers Lounge PWA surface inside the shared Next.js website package. The current review branch contains the approved Explore layout direction plus a focused desktop resize-lifecycle refinement. It has not been merged into `main`, deployed, or treated as production verification.

The current experience is:

- Full-screen cinematic Wachau approach background with continuous scroll, wheel, touch/pointer, and range-slider scrubbing.
- Four direct stations in the fixed order `Topo → Sector → Rock → Region`.
- Compact `StationPeek` recommendation near the upper-left; heavy modules open only after an explicit action or intentional deep link.
- Desktop station boxes that can be opened, moved, resized, minimized, restored, expanded, fullscreened, and closed.
- Upper-right minimized station tray using full names.
- Mobile/tablet card-stack behavior rather than arbitrary floating windows.
- `Wall Reveal` limited to `Place`, `Gallery`, and `Topo`; the separate Nasenwand 3D station remains independent.

The latest code change hardens resize handling with window-level pointer cleanup, a mouse-event fallback, direct handle lifecycle events, and larger resize hit targets. The browser harness confirmed the handles and responsive rules, but it did not produce a reliable physical drag dimension delta. Real trackpad/mouse verification remains the next human check.

## Canonical paths

Canonical checkout:

`D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment-public-v5`

Active application:

`D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment-public-v5\website`

Separate source/workspace bundle:

`D:\VERTICALMOMENT\WEBSITE`

Protected unrelated checkout — do not modify:

`D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment`

## Software stack

Runtime and tooling observed on 2026-08-14:

- Node.js `v24.18.0`
- npm `11.16.0`
- GitHub CLI `2.96.0`
- Next.js `16.2.x` (build resolved `16.2.12`)
- React `18.3.x` / React DOM `18.3.x`
- TypeScript `5.5.x`
- Vitest `3.2.7`
- OpenNext Cloudflare `1.20.x`
- Cloudflare Wrangler `4.120.1`
- Serwist `9.5.12` for the service worker/PWA cache
- Three.js `0.183.2`
- Google `<model-viewer>` `4.3.1`
- Zustand `5.0.14` for layout state
- `idb-keyval` for persisted local layout storage
- `fflate` for local/offline data packaging
- Drizzle ORM for application data integration
- Sharp for image processing/build support

Primary deployment/runtime direction: Next.js App Router, OpenNext, Cloudflare Workers, and Serwist. Heavy 3D, panorama, and source media remain lazy/private by policy; publish optimized derivatives only.

## Important files

- `website/src/App.tsx` — Explore workspace orchestration, station mapping, StationPeek, box rendering, tray, deep links.
- `website/src/components/animation/IntroScrubSequence.tsx` — cinematic scrub, wheel, touch, pointer drag, slider, station flights.
- `website/src/components/animation/IntroScrubSequence.module.css` — combined bottom scrub rail.
- `website/src/components/boxes/BoxContainer.tsx` — shared box shell, controls, dragging, resizing, modes.
- `website/src/components/boxes/BoxContainer.module.css` — shared window layout, controls, responsive behavior, resize targets.
- `website/src/components/boxes/BoxWallReveal.tsx` — Place/Gallery/Topo stages.
- `website/src/components/shell/StationPeek.tsx` — compact station recommendation.
- `website/src/core/layoutState.ts` — persisted layout, IndexedDB merge, undo/redo.
- `website/src/core/layoutAlgorithms.ts` — Explore/Grid/Presentation layout calculations.
- `website/src/core/stationPresentation.ts` — Region/Rock/Sector/Topo mapping.
- `website/public/explore-content.json` — registry, box metadata, scrub metadata, offline pack, heavy assets.
- `website/package.json` — scripts and dependency contract.
- `website/wrangler.jsonc` — Cloudflare/OpenNext configuration.
- `website/serwist.config.mjs` — service-worker build configuration.

Station mapping:

| Station | Box |
| --- | --- |
| Region | `crag-locator` |
| Rock | `wall-reveal` |
| Sector | `nasenwand-spatial` |
| Topo | `nasenwand-model` |

## Validation completed

Run from `D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment-public-v5\website`:

- `npm.cmd test` — 63/63 tests passed.
- `npm.cmd exec tsc -- --noEmit` — passed.
- `npm.cmd run build:next` — 365 routes generated.
- `npm.cmd run build:sw` — 59 precached URLs, 3.22 MB.
- `explore-content.json` — valid JSON.
- `git diff --check` and staged diff check — passed.
- Desktop browser check at `1280×720` — four stations, one continuous slider, full-name tray, eight resize handles, no new console errors.
- Phone browser check at `390×844` — mobile card layout, four stations, continuous slider, no desktop resize handles, no new console errors.
- Direct station semantics — `aria-current` changed from `Topo` to `Rock` after direct station selection.

The generated `website/public/sw.js` is ignored and must not be staged.

## Local commands

```powershell
cd "D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment-public-v5\website"
npm.cmd run dev -- --port 3008
npm.cmd test
npm.cmd exec tsc -- --noEmit
npm.cmd run build:next
npm.cmd run build:sw
```

Local browser route:

`http://localhost:3008/explore-app`

Useful deep-link examples:

- `/explore-app?intro=skip`
- `/explore-app?open=nasenwand-model&mode=normal`
- `/explore-app?open=crag-locator&intro=skip`

## GitHub review workflow

The review branch is intentionally separate from `main`. The code commit above is local and is being pushed for review. The expected sequence is:

1. Review the draft PR and preview.
2. Test physical resize with a mouse or trackpad, especially east/west/corner handles, bottom-rail collision, restore-from-tray, and station changes.
3. Run CI and review any failures.
4. Owner merges into `main`.
5. Run the final post-merge build and fresh deployed verification separately.

Do not merge, deploy, or claim production completion from this handoff alone.

## Future work priorities

1. Human-verify resize dimension changes on Crag Locator, Nasenwand Routes, Nasenwand 3D, and Wall Reveal.
2. Review the upper-right tray at common desktop and phone widths with six minimized boxes.
3. Review control contrast, icon clarity, touch hit targets, and fullscreen behavior.
4. Verify the bottom rail never covers the active box or normal finger path.
5. Re-run wheel, touch, pointer, slider, keyboard, `aria-current`, `vm:scrub-station`, reduced-motion, deep-link, minimize/restore, drag, resize, fullscreen, and close checks after any further UI change.
6. Preserve source media, heavy model/panorama masters, provisional-data labels, and the current public-site versus single-PWA product boundary.

## Ownership and safety rules

- Never use `git add -A` in this checkout; stage explicit paths.
- Keep the protected `D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment` checkout untouched.
- Keep commit, push, PR review, merge, deployment, and production verification as separate gates.
- Treat climbing facts and route geometry as provisional unless explicitly verified.
- Keep raw/heavy media private and publish optimized derivatives only.
- Do not run `npm audit fix` automatically; existing Cloudflare/OpenNext dependency findings can cause unrelated upgrades.
