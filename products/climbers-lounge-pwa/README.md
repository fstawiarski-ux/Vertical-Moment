# Climbers Lounge / Explore PWA

## Mission

Climbers Lounge and Explore Lab are one installable, offline-capable climbing product. Different installed Brave names represent versions or naming stages of the same product.

The product includes:

- private `/explore-app` workspace;
- `/explore` atlas and region/crag/route experience;
- `/climbers-lounge` bridge;
- route search and registry content;
- panoramas, field notes, topo and 3D/spatial modules;
- an unlisted local-first contributor workspace for photo, GPX, PDF and note packages;
- desktop freeform layout, tablet grid and phone card presentation;
- collision avoidance, persisted layout, lazy heavy media and offline support.

## Current ownership

Primary current files include:

- `website/src/**`
- `website/app/explore-app/**`
- `website/app/(platform)/explore/**`
- `website/app/(platform)/contribute/**`
- `website/app/(platform)/report/**`
- `website/app/climbers-lounge/**`
- `website/app/offline/**`
- Nasenwand and other climbing-experience routes/components
- `website/public/explore-content.json`
- PWA manifest/icons and PWA-specific optimized media
- `website/src/pwa/**` and `website/serwist.config.mjs`
- `website/lib/contribution-local.ts`

Package manifests, the root Next layout, OpenNext, Wrangler, workflows and shared public assets are cross-product infrastructure.

## Current canonical status

- Merged PWA foundation: PRs #27-#32 on `main`.
- Local-first contributor beta: PR #34 on `main` at `da6630c`; live `/contribute` is unlisted/noindex and stores originals in device IndexedDB until ZIP export.
- Active capability branch: `agent/explore-capabilities-2026-08-12` at recorded HEAD `5fb71fe0249d51f8759273c5e2e903fe3c59cf72`.
- Preserved spatial workflow: `agent/jammerwandl-source-glb` at `8f4b894`; review its three post-PR #6 viewer/overlay/Blender commits before integration.
- EXP-02 is preserved separately as a four-file Master ZIP/review patch.
- Registry version recorded for EXP work: `7`.
- `website/public/sw.js` is generated and must not enter source patches.

The contributor beta has no remote upload, review queue, authentication or automatic publication yet. Do not describe a local draft as submitted to a server.

## Branch and validation

Use `pwa/<task>`. Never expose `/explore-app` through public navigation without approval. Never invent climbing data or imply route-level behavior that is not implemented.

Minimum review should cover targeted unit tests, full Next build, lazy chunk behavior, local browser/device QA, install/update behavior, offline fallback and PWA regression checks appropriate to the change. Contributor changes must also prove original-file persistence after reload and inspect the exported ZIP manifest/evidence.

## Safe content update map

| Content | Reviewed repository location | Rule |
|---|---|---|
| PWA card registry and asset references | `website/public/explore-content.json` | Keep IDs stable and bump the Serwist registry revision when deployed content changes |
| Canonical climbing API data | `database/api/v1/` | Update canonical/reconciled data first, then run `website/scripts/sync-data.mjs` |
| Generated browser data copy | `website/public/data/v1/` | Never edit as an independent source |
| Atlas GPX delivery files | `website/public/atlas-gpx/` | Preserve source/verification status and use stable names |
| Region-to-topo scrub clips | `website/public/photography/explore-app/scrub/` | Publish optimized derivatives; update the sequence source and PWA cache revision together |
| Panorama previews and manifest | `website/public/photography/panoramas/` | Follow the shared manifest/viewer pattern; keep masters private |
| Contributor crash-test packages | Browser `/contribute` export ZIP | Review `manifest.json` and original evidence before any later canonical import |

The contributor beta is the preferred crash-test intake surface. Git remains the reviewed publication layer, not the place where a contributor directly overwrites canonical route data or heavy media.
