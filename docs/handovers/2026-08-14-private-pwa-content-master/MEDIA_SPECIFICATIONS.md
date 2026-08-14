# Media and device specifications

These are the current implementation rules and measured examples. Pixel dimensions are acceptance requirements; byte figures below are reference observations, not a promise that every future asset must match them. A new asset still needs visual and loading review.

## Device bands

The PWA chooses its layout from viewport width:

| Device band | CSS viewport | Intended layout |
| --- | ---: | --- |
| Phone | `< 768px` | Card/presentation flow; touch-safe controls; lazy heavy modules. |
| Tablet | `768-1023px` | Grid and larger card workspace; touch and keyboard both supported. |
| Desktop | `>= 1024px` | Freeform workspace; larger media and full navigation. |

Use screenshots at these review widths: 390 x 844 phone, 820 x 1180 tablet, and 1440 x 900 desktop. These are review fixtures, not restrictions on other devices.

## Image families

Every new visual intended for a responsive card should have AVIF and WebP derivatives at the widths needed by the component. Keep the source crop and focal point documented.

| Use | Required base dimensions | Current implementation example |
| --- | --- | --- |
| Full workspace/background | 480, 960, 1920 px wide | 1920 x 1080 source declaration; measured AVIF examples: 20 KB, 58 KB, 161 KB. |
| Spatial/card image | 480, 960, 1280 px wide | 1280 x 960; measured AVIF examples: 24 KB, 94 KB, 194 KB. |
| Panorama preview | 480, 960, 1600 px wide | 1600 x 462; measured AVIF examples: 12 KB, 46 KB, 132 KB. |
| Model poster | 960 x 720 minimum | Current Nasenwand poster uses 960 x 720. |
| Wall-reveal poster | 1600 x 900 | Current poster uses 1600 x 900. |
| Small square gallery image | At least the displayed source size | Current gallery image is 532 x 532. |

Use `srcSet` and `sizes` in the registry. Do not send the 1600/1920 derivative to a phone when the 480/960 derivative is sufficient. Keep width and height in the registry to prevent layout shift.

## Video and motion

- Deliver an optimized MP4 derivative for the PWA; keep camera masters private.
- Preserve the actual duration in the registry. Do not use a rounded duration when scrubbing depends on it.
- Current scrub chapter durations are 3.0 seconds, 20.52 seconds, and 2.4 seconds.
- Provide a poster image, descriptive alt text, direction, and object position.
- Test drag interruption, slider continuity, fixed Region/Rock/Sector/Topo stations, reduced motion, and a slow network.
- Do not add a video to the offline pack until cache size and phone loading have been reviewed.

## 3D and panorama

- Deliver GLB only after geometry, texture, fallback poster, orbit controls, and provisional/verified labelling are reviewed.
- The current Nasenwand GLB is 1,745,504 bytes. Treat this as a measured reference, not an automatic maximum for a new model.
- Keep panorama masters private. Publish the shared viewer's approved previews and manifests, with region/crag/sector relationship and source note.
- A panorama button must return to its owning region/crag/sector context; do not leave a dead-end viewer.

## Accessibility and rights fields

Each published image/video/model record needs:

```text
alt text
caption (when needed)
creator/source
rights state
location confidence
provisional/unverified label (when applicable)
fallback asset
```

No asset enters `05-APPROVED-FOR-PUBLISH` without an explicit rights state. A file being present locally is not evidence that it may be published.
