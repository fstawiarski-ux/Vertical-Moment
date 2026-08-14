# Page and box content matrix

This is the working register for filling the product without inventing content. `MISSING` means an owner input is required; `PROVISIONAL` and `UNVERIFIED` must remain visible in the UI where relevant.

| Surface | Current role | Content to fill | Evidence/status gate |
| --- | --- | --- | --- |
| `/climbers-lounge` | Public bridge | Keep copy to Coming Soon and private-development context. No app/catalog CTA. | Public-safe copy; no private links. |
| `/explore-app` intro | Region -> Rock -> Sector -> Topo entry | Poster, 3 chapters, alt text, actual durations, station labels, reduced-motion behavior. | Motion QA plus rights/source review. |
| `vm-7073` gallery box | Photography card | Title, region, crag, image, alt, caption/source. | Image rights and location source. |
| `nasenwand-spatial` box | Route/spatial workspace | Region, crag, sector, route data reference, context image, provisional geometry label. | Canonical route facts; no guessed geometry. |
| `wachau-16` panorama box | Panorama entry | Region/crag/sector relationship, preview family, viewer manifest, source/rights note, return link. | Panorama source and viewer navigation QA. |
| `crag-locator` atlas box | Region/crag/route browse | Canonical API mirror, counts, search, empty states, route return links. | `verify-data`, link QA, generated data only. |
| `nasenwand-model` 3D box | Spatial study | GLB, poster, size, controls, loading/fallback, provisional label. | Model review and mobile loading test. |
| `wall-reveal` box | Narrative study | Poster, stage copy, media, source state, route to related context. | Content and motion QA; no unsupported topo claim. |
| `/explore/[region]` | Region detail | Region identity, count, crag list, map state, return to atlas. | Canonical region record. |
| `/explore/[region]/[crag]` | Crag detail | Crag identity, sector/route list, panorama if available, empty states. | Canonical crag and route records. |
| `/panoramas/[region]` | Panorama index/viewer | Preview cards, controls, source labels, back/close, lazy loading. | Viewer QA and source evidence. |
| `/contribute` and `/report` | Private local-first intake | Local draft, photo/GPX/PDF/note package, export manifest, no server publication claim. | Original persistence and ZIP evidence. |
| `/offline` | PWA support | Clear offline state, retry, path back to app. | Offline fallback test. |

## Box record minimum

Every box must have: stable `id`, supported `type`, title, region, crag, optional verified sector, description, media metadata when present, initial layout, and a deliberate destination or action. A box that cannot explain its next action is not ready for the registry.
