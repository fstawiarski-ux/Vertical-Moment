# Explore pilot asset slots

Copy this folder with `npm run pilot:new -- <pilot-id>`. Do not add empty image, video, panorama, or model files.

For each asset in `pilot.json`:

1. Leave `status` as `missing` and `src` as `null` while the web derivative is absent.
2. Upload the optimized derivative to `targetPath`.
3. Set `src` to the public path and move `status` to `review`.
4. After visual and field-owner review, move `status` to `ready`.

The source master stays outside the PWA. Keep the five permanent modules—Locator, Panorama, Routes, Wall, Topo—and fill their slots instead of adding a sixth box.

Recommended preparation lanes:

- Images: AVIF/WebP derivatives with descriptive alt text.
- Scroll scrub: short-GOP MP4 proxies; keep the original video elsewhere.
- 3D: validate glTF, optimize a copy, and record the final byte size.
- 360: start with an equirectangular poster; add a self-hosted tiled viewer only when the source warrants it.
