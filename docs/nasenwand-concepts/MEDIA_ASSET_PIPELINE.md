# Nasenwand flagship media pipeline

## Goal

Turn the supplied `DJI_0012_MASTER_BUNDLE` into a reviewable, deployable media gallery without changing the original files or placing oversized masters in the Cloudflare Worker bundle.

## Source audit

| Source | Role | Original size | Public decision |
|---|---:|---:|---|
| `hero_1080p.mp4` | 40.6 s H.264 master | 56.43 MiB | Excluded; use WebM with 720p MP4 fallback |
| `hero_1080p.webm` | 40.6 s VP9 hero | 16.99 MiB | Ship unchanged |
| `hero_720p.mp4` | H.264 compatibility fallback | 10.55 MiB | Ship unchanged |
| `scrub_720p_allkey.mp4` | Frame-accurate scrub master | 44.84 MiB | Encode a 960 × 540, CRF 28 all-key derivative |
| `loop_pingpong_12s.mp4` | Landscape ambient loop | 15.49 MiB | Ship unchanged |
| `loop_6s_story.mp4` | Portrait story loop | 10.48 MiB | Ship unchanged |
| `loop_1080.webp` | 288-frame animated WebP | 31.76 MiB | Resize to 720 × 405, quality 42 |
| `loop_6s_480.gif` | Compatibility preview | 3.86 MiB | Ship unchanged |
| `07_scroll_scrub.rar` | Source kit and layered assets | 63.08 MiB | Keep outside public; extract reviewed derivatives only |

All source and derivative hashes live in `website/public/photography/nasenwand/media/asset-manifest.json`.

## Repeatable preparation

1. Copy the source bundle into a temporary preparation workspace. Never edit it in place.
2. List the archive before extraction and review every included HTML, image, video, and vector file.
3. Encode the scrub derivative with a 960-pixel width, H.264, CRF 28, GOP 1, no audio, and fast-start metadata. Preserve all-keyframe seeking.
4. Resize the animated WebP to 720 pixels wide at quality 42 and preserve all 288 frames.
5. Resize the five transparent depth planes to 1280 pixels wide and WebP quality 72 with alpha quality 80.
6. Convert the poster to a 1600-pixel WebP at quality 80.
7. Copy only web-safe outputs into `website/public/photography/nasenwand/media/`.
8. Recompute SHA-256 hashes and update the manifest.
9. Confirm each public file is below 25 MiB before building the Cloudflare bundle.

## Content safety gate

The archive’s `topo_routes.svg` contains example route grades that are not verified Nasenwand data. It is intentionally excluded. Do not publish it, copy its labels, or treat it as a route-data source. The neutral supplied contour asset is used only as a visual scrub overlay.

## Runtime method

- The active media mode is the only heavy asset mounted.
- Video sources use metadata preloading and a poster.
- The hero provides WebM first and MP4 second for codec fallback.
- Scroll scrub keeps the video paused and maps scroll, stage drag, or range input to `currentTime`.
- Ordinary loops use muted inline playback with Pause and First frame controls.
- Reduced-motion disables autoplay, sticky scroll linking, and pointer depth.

## Future-copy template

For another flagship spot, preserve the same seven IDs and replace only paths, copy, duration metadata, orientation, hashes, and status wording in `website/app/data/nasenwand-concepts.ts` and the media manifest. Do not reuse Nasenwand route or topo assets for another location.
