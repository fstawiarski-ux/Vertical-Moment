# Optimization notes

## Current bundle

The page ships responsive image pairs rather than source masters. Approximate derivative weights are:

- 1280 px set: about 1.2 MB across photo, spatial, topo, and route assets;
- 2400 px set: about 3.7 MB across the four assets;
- route-only prototype GLB: about 29 KB, stored under `models/prototypes/nasenwand/` and not shipped with the Worker.

The source photograph is eager/high-priority. Supporting visual layers are lazy and asynchronously decoded. The browser chooses one candidate from each responsive pair.

## Recommended budgets

- First visible photo: target ≤ 700 KB desktop and ≤ 250 KB mobile.
- Entire non-3D concept experience: target ≤ 4 MB desktop and ≤ 1.5 MB mobile before cache.
- Reviewed wall GLB: aim for ≤ 8 MB desktop and preferably ≤ 4 MB on the phone path.
- Individual KTX2 texture: normally 2K; use 4K only after camera-distance review.
- Main-thread interaction work: stay under one animation frame; do not recompute image pixels at runtime.

## Loading strategy

- Keep the photo as the immediate first paint.
- Preload only the first active concept's necessary asset.
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
