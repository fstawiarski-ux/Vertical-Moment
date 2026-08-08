# Vertical Moment — Nasenwand spatial concepts

This review-ready bundle adds one isolated Next.js route containing only the three selected directions:

1. **01 Split Reveal** — aligned photo/spatial comparison with direct dragging.
2. **02 Geological Wipe** — an irregular rock-edge reveal driven by the same interaction state.
3. **06 Cinematic** — photo → spatial relief → provisional topo/route sequence.

The route preserves the concept selector, wide/detail/monochrome controls, interaction and route-draw sliders, pointer depth, touch/mouse dragging, responsive behavior, keyboard-friendly inputs, and reduced-motion handling.

The implementation is isolated on `agent/nasenwand-concepts`, based on the current remote `main`. The original dirty photography checkout remains untouched. No pull request, merge, Cloudflare deployment, or production cutover is included.

## Target

- Repository: `fstawiarski-ux/Vertical-Moment`
- Current website structure: `website/app`, Next.js 16 App Router
- Website version: `0.5.0-beta`
- Added route: `/nasenwand-concepts`
- Homepage integration: the existing 3D Lab call-to-action now opens the Nasenwand study
- Runtime dependencies added: none

## Repository map

- `website/app/nasenwand-concepts/` — isolated review route.
- `website/app/components/nasenwand/` — reusable interaction component and scoped styles.
- `website/app/data/nasenwand-concepts.ts` — the three concepts and asset configuration.
- `website/public/photography/nasenwand/` — optimized responsive visual assets.
- `website/tools/nasenwand/` — reusable, non-destructive asset preparation.
- `models/prototypes/nasenwand/` — lightweight route/camera reference kept out of the Worker bundle.
- `docs/nasenwand-concepts/` — implementation, pipeline, optimization, testing, reuse, and GitHub guides.

## Review path

1. Open the pushed branch comparison linked in `GITHUB_INTEGRATION.md`.
2. Review the isolated route, homepage CTA, provisional-content labels, and asset footprint.
3. From `website/`, run:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run dev
```

4. Open `/nasenwand-concepts` and complete `TESTING_CHECKLIST.md`.
5. Create and merge the pull request yourself only after review.

## Important status boundary

The photography is a real Nasenwand source. The topo reference and route-only GLB/JSON are prototype material and remain explicitly unverified. The included “spatial relief” is a deterministic art-direction derivative, not proof that the 729–930 MB RealityScan wall model is wired into the browser.

The master scans stay outside the website. A future reviewed, compressed wall GLB should be delivered from Cloudflare R2 and loaded only on user intent.
