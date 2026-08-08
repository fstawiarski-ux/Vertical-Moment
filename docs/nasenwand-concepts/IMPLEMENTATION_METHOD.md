# Implementation method

## Production shape

The bundle uses one config-driven client component rather than three separate demos. This keeps shared controls, accessibility behavior, and future crag replication in one place.

```text
page.tsx
  └─ NasenwandConceptGallery(config)
       ├─ media selector: film / scrub / loops / depth
       ├─ lazy active-media stage and transport controls
       ├─ page-linked or direct-drag scrub playhead
       ├─ concept selector: 01 / 02 / 06
       ├─ shared image stage
       ├─ framing/filter controls
       ├─ interaction progress
       └─ route-draw progress
```

The data file owns concept labels and asset URLs. The component owns state and pointer behavior. The CSS module owns the visual mapping from state to each concept.

## Shared state model

- `conceptIndex` selects Split Reveal, Geological Wipe, or Cinematic.
- `mediaIndex` selects one of the seven media modes; inactive heavy assets are not mounted.
- `mediaProgress` is shared by video playheads, manual scrubbing, page-linked scrubbing, and the depth reveal.
- `mediaPlaying` controls only ordinary video modes; scrub video remains paused and seeks by playhead.
- `scrollLinked` makes the all-keyframe derivative follow the sticky scrub runway.
- `progress` is the common 0–100 interaction value. Range input and direct stage dragging both update it.
- `routeProgress` controls how much of the route-reference layer is revealed from the bottom.
- `frameMode` applies wide, detail, or monochrome treatment to every visual layer.
- `pointer` provides restrained depth on fine-pointer devices.
- `reducedMotion` removes pointer depth and collapses transitions when the user requests less motion.

## Media mapping

- Ordinary film and loop modes mount one `<video>` with metadata preloading, native codec fallback, muted inline playback, pause, and first-frame controls.
- Scroll scrub mounts the optimized all-keyframe MP4, keeps it paused, and updates `currentTime` from page scroll, direct stage dragging, or the accessible range input.
- Animated WebP and GIF modes mount only the selected image source.
- Depth mode mounts five real image layers from the supplied archive and applies restrained pointer transforms; reduced-motion removes those transforms.
- The portrait story cut uses `object-fit: contain` so the 9:16 frame is never cropped into a false landscape composition.

## Concept mapping

### 01 Split Reveal

The photo remains the base. The aligned spatial derivative is clipped from the left using `progress`. A divider and handle sit at the same percentage. Because both assets originate from the same photograph, the reveal stays registered.

### 02 Geological Wipe

The same aligned layers are used, but the reveal edge is a six-point polygon. Four edge values are derived from `progress`, producing an irregular wall-like transition without a second interaction system.

### 06 Cinematic

Progress drives three phases:

1. source photograph;
2. spatial relief;
3. desaturated topo reference plus route-reference reveal.

The route draw remains independently adjustable. It is disabled in 01 and 02 so the control does not imply that provisional route geometry is aligned to the source drone frame.

## Accessibility decisions

- All concept choices are real buttons with `aria-pressed`.
- The concept selector is also available as a named range input.
- Interaction and route-draw sliders have explicit accessible names and numeric output.
- The stage exposes a descriptive group label; it does not replace the sliders as the keyboard path.
- Visible controls meet a 44 px minimum target.
- Route status is stated in ordinary text, not only by color.
- `prefers-reduced-motion` removes pointer transforms and near-instantly resolves transitions.

## Upgrade points

The current spatial image is deliberately a deterministic photo derivative. Replace only `config.spatial` when a reviewed render becomes available. The interaction component does not need to change.

When a real wall GLB is ready, add an on-demand viewer behind the spatial phase instead of loading it with the first page paint. Keep the existing photo derivative as the poster/fallback and preserve the same progress API.
