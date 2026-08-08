# Implementation map

| Repository path | Purpose |
|---|---|
| `website/app/nasenwand-concepts/page.tsx` | Isolated no-index review route |
| `website/app/components/nasenwand/nasenwand-concept-gallery.tsx` | Config-driven interactive experience |
| `website/app/components/nasenwand/nasenwand-concept-gallery.module.css` | Scoped responsive styling |
| `website/app/data/nasenwand-concepts.ts` | Three concepts and crag asset configuration |
| `website/public/photography/nasenwand/*` | Optimized photo/spatial/topo/route assets |
| `website/public/photography/nasenwand/media/*` | Lazy-loaded film, scrub, loop, poster, contour, and depth derivatives |
| `website/tools/nasenwand/*` | Reusable non-destructive asset-prep tool |
| `models/prototypes/nasenwand/*` | Route-only GLB/JSON and camera presets, excluded from Worker delivery |
| `docs/nasenwand-concepts/*` | Method, pipeline, optimization, testing, reuse, and integration guides |
| `website/app/page.tsx` | Existing 3D Lab CTA now links to the approved study |
| `website/package.json`, `website/package-lock.json`, `website/VERSION.md` | Website release metadata updated to `0.6.0-beta` |

The canonical climbing database, archived platform routes, theme styles, navigation, and redirects are unchanged.

The standalone route imports the existing `app/photography-theme.css`. That file already exists in the inspected repository and is intentionally not duplicated here.
