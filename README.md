# Vertical Moment

Vertical Moment is a phone-first climbing explorer and visual-technology workspace for photography, regional/crag/route data, panoramas, and provisional 3D studies.

The production site is a Next.js App Router application in `website/`, packaged for Cloudflare with OpenNext. The existing public explorer remains at `/explore`.

## Explore Lab PWA

`/explore-app` is an isolated, `noindex` experimental PWA workspace. It does not replace or modify the public `/explore` experience.

Explore Lab is a locked visual canvas with floating, independently scrollable boxes:

- `explore`: freeform desktop positions with pointer dragging and resizing.
- `grid`: snapped/organized layout; used automatically for tablet-sized screens.
- `presentation`: a repeatable hero-and-column layout.
- Mobile: vertical scroll-snap cards with large touch targets and no freeform dragging.
- Box modes: normal, minimized, expanded, and fullscreen.
- Any content box can become the locked hero; the default Nasenwand hero can be restored from the toolbar.

Layout state is managed by a typed Zustand store in `website/src/core/`, then persisted to versioned IndexedDB. Runtime content and asset references live in `website/public/explore-content.json`, so content can change without rewriting the layout engine.

### Scroll-scrub hero

`website/src/components/animation/ScrollScrubHero.tsx` adapts the verified Nasenwand all-keyframe orbit to the locked app canvas. It preserves the existing `/nasenwand-concepts` implementation and media rather than deleting or replacing it. The poster is immediate; the MP4 is requested only when the user begins scrubbing.

### 3D model box

`website/src/components/boxes/Box3DModel.tsx` loads `@google/model-viewer` and `/models/nasenwand-topo.glb` only after the panel is active/visible or the user explicitly requests it. The viewer supports orbit, pan, and zoom. The 1.7 MB browser-ready GLB is treated as provisional visualization, not verified route or safety data.

### Offline behavior

- `manifest.webmanifest` and 192/512/maskable icons make the lab installable.
- Serwist precaches the `/explore-app` app shell, offline fallback, manifest, icons, and required Next.js chunks (about 3.1 MB in the current build).
- Images use bounded cache-first runtime storage.
- GLB and scrub video have separate bounded cache-first stores; the video cache supports byte-range responses.
- **Save offline** downloads the optimized normal-weight image pack on demand.
- Service-worker registration is production-only, avoiding stale caches during `npm run dev`.

## Local development

Requirements: Node.js 20+ and npm. The validated local environment uses Node 24 and npm 11.

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000/explore-app` for the PWA lab. The public explorer remains at `http://localhost:3000/explore`.

## Build and preview

```bash
cd website
npm run build
npm start
```

`npm run build` runs the Next.js production build and then creates `public/sw.js` from `src/pwa/service-worker.ts`.

For the Cloudflare/OpenNext path:

```bash
npm run preview
```

This builds the Cloudflare bundle, ensures the generated service worker is present in `.open-next/assets`, and starts the local OpenNext preview. `npm run deploy` and `npm run upload` use the same verified build pipeline but should only be run with explicit deployment approval.

## Key files

- `website/src/App.tsx`: Explore Lab composition and content-registry loading.
- `website/src/core/types.ts`: shared layout and registry contracts.
- `website/src/core/layoutState.ts`: Zustand actions, z-index behavior, and IndexedDB persistence.
- `website/src/core/layoutAlgorithms.ts`: explore, grid, and presentation algorithms.
- `website/src/components/boxes/BoxContainer.tsx`: draggable/resizable box shell and modes.
- `website/src/components/shell/LayoutToolbar.tsx`: layout, hero, minimize, and offline controls.
- `website/src/pwa/service-worker.ts`: app-shell precache and bounded runtime caching.
- `website/serwist.config.mjs`: Serwist build configuration and cache budget.

## Data and attribution

Crag names and coordinates include data derived from © OpenStreetMap contributors (ODbL 1.0). Route and media data should remain clearly marked as verified, provisional, or pending field review.
