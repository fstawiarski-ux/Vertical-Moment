# Future crag copy template

Use this sequence when repeating the experience for another crag.

## 1. Prepare a source set

Minimum:

- one clean wall photograph;
- one reviewed topo/reference image from a compatible viewpoint;
- a short status note describing what is authoritative and what is provisional.

Optional upgrade inputs:

- reviewed wall GLB;
- route geometry JSON/GLB;
- named camera presets;
- a poster render.

## 2. Generate web derivatives

Run the supplied tool with a new output folder:

```powershell
node tools\nasenwand\prepare-assets.mjs `
  --photo "D:\masters\NEW_CRAG\wall-photo.jpg" `
  --topo "D:\masters\NEW_CRAG\topo-reference.png" `
  --prefix "new-crag" `
  --out "public\photography\new-crag"
```

The prefix becomes the generated filename stem. Keep it lowercase and hyphenated, and use the same stem in the config paths.

## 3. Add a config object

Copy `NASENWAND_EXPERIENCE` in `app/data/nasenwand-concepts.ts` and change only the identity, status, alt text, and asset paths:

```ts
export const NEW_CRAG_EXPERIENCE: SpatialExperienceConfig = {
  id: 'new-crag-region',
  cragName: 'New Crag',
  region: 'Region, Country',
  statusLabel: 'Spatial study · prototype',
  statusNote: 'Route reference is provisional and must be verified before publication.',
  photo: {
    src: '/photography/new-crag/new-crag-photo-2400.webp',
    srcSet: '/photography/new-crag/new-crag-photo-1280.webp 1280w, /photography/new-crag/new-crag-photo-2400.webp 2400w',
    alt: 'Reviewed description of the source photograph',
  },
  spatial: {
    src: '/photography/new-crag/new-crag-spatial-2400.webp',
    srcSet: '/photography/new-crag/new-crag-spatial-1280.webp 1280w, /photography/new-crag/new-crag-spatial-2400.webp 2400w',
    alt: 'Spatial study derived from the source photograph',
  },
  topo: {
    src: '/photography/new-crag/new-crag-topo-2400.webp',
    srcSet: '/photography/new-crag/new-crag-topo-1280.webp 1280w, /photography/new-crag/new-crag-topo-2400.webp 2400w',
    alt: 'Provisional route reference for New Crag',
  },
  routes: {
    src: '/photography/new-crag/new-crag-routes-2400.png',
    srcSet: '/photography/new-crag/new-crag-routes-1280.png 1280w, /photography/new-crag/new-crag-routes-2400.png 2400w',
    alt: '',
  },
};
```

## 4. Add a route

Create `app/new-crag-concepts/page.tsx`, copy the Nasenwand page, and pass the new config. Keep `robots.index` false until the content and route geometry are approved.

## 5. Review before promotion

- Confirm the source photo and spatial derivative are aligned.
- Confirm the topo and extracted route layer are aligned with one another.
- Do not imply the topo is aligned to the photo unless camera registration proves it.
- Verify labels, ownership, source rights, route facts, and publication permission.
- Test the three concepts at phone and desktop breakpoints.
- Approve the route before linking it from the public homepage.

## 6. Optional flagship media desk

When the new crag has a full motion package, copy the seven-mode structure rather than the Nasenwand files:

- landscape hero WebM plus MP4 fallback;
- an all-keyframe scrub derivative below 20 MiB;
- landscape ping-pong loop;
- portrait story loop;
- animated WebP and GIF fallbacks;
- poster image;
- optional reviewed depth layers and neutral contour overlay.

Create a separate `public/photography/<new-crag>/media/asset-manifest.json`, record original and derivative hashes, keep every public file below 25 MiB, and add new media URLs in the crag config. Never copy Nasenwand topo, route, label, or status data into another crag.
