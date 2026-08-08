# Optimization notes

## Current bundle

The page ships responsive image pairs rather than source masters. Approximate derivative weights are:

- 1280 px set: about 1.2 MB across photo, spatial, topo, and route assets;
- 2400 px set: about 3.7 MB across the four assets;
- route-only prototype GLB: about 29 KB, stored under `models/prototypes/nasenwand/` and not shipped with the Worker.

The source photograph is eager/high-priority. Supporting visual layers are lazy and asynchronously decoded. The browser chooses one candidate from each responsive pair.

The flagship media desk contains about 88 MiB of public derivatives in total, but only the selected mode is mounted. The first mode requests a 16.99 MiB WebM with a 10.55 MiB MP4 fallback; browsers download the first supported source, not both. Every public file is below 25 MiB. The oversized RAR, 1080p MP4 master, 720p all-key master, and 1080px animated WebP master remain outside the Worker bundle.

## Recommended budgets

- First visible photo: target ≤ 700 KB desktop and ≤ 250 KB mobile.
- Entire non-3D concept experience: target ≤ 4 MB desktop and ≤ 1.5 MB mobile before cache.
- Reviewed wall GLB: aim for ≤ 8 MB desktop and preferably ≤ 4 MB on the phone path.
- Individual KTX2 texture: normally 2K; use 4K only after camera-distance review.
- Main-thread interaction work: stay under one animation frame; do not recompute image pixels at runtime.

## Loading strategy

- Keep the photo as the immediate first paint.
- Preload only the first active concept's necessary asset.
- Mount only the selected media mode. Video modes use `preload="metadata"`; image and depth modes do not enter the DOM until selected.
- Keep the poster under 300 KB so the stage paints before the active video is ready.
- Keep the all-keyframe scrub derivative below 20 MiB and use it only when the visitor selects Scroll scrub.
- Warm the Cinematic topo/route assets after idle time or on concept-button hover/focus.
- Import any WebGL viewer dynamically with SSR disabled.
- Release renderer resources when the 3D chapter unmounts.
- Respect reduced motion and device/network constraints before enabling continuous rendering.
- Keep a poster/fallback path for weak signal, data-saving mode, and WebGL failure.

## Cloudflare and repository hygiene

- Do not place 729–930 MB source GLBs in `public/`.
- Do not rely on Git LFS objects as Worker static assets.
- Keep web models in R2 and reference immutable versioned URLs.
- Add long-lived cache headers to fingerprinted image/model objects.
- Keep the app shell and route component in Git; keep raw scan masters in the established asset archive.

## Visual performance

- Pointer depth is transform-only.
- Split and Geological transitions use clipping rather than canvas pixel work.
- Cinematic phases use opacity and clipping on precomputed images.
- No scroll listener runs continuously.
- No third-party animation library or WebGL dependency is required for this version.
