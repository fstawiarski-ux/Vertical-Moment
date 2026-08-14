# Vertical Moment private PWA content master

Status: prepared for review on branch `pwa/explore-surface-audit-2026-08-14`.
Baseline: `origin/main` at `49f795b634f6df6a26e0e7cae90f98b8c22541be`.
Date: 2026-08-14.

## The decision carried forward

Climbers Lounge / Explore Lab is still an in-development PWA. It is private by direct link for the owner and trusted friend review. The public website must show only the Coming Soon bridge. The bridge must not expose a public app or catalog CTA.

`/explore-app` remains available by direct link and keeps `noindex` metadata. `/start` is a legacy public entry point and now redirects to `/climbers-lounge`, not to the private app. The PWA manifest and service worker remain in place so a deliberately shared direct link or installed private copy continues to work.

This is an unlisted surface, not authentication. The URL must not be treated as protection for copyright, business information, or other sensitive material. Do not put confidential source material, unreleased masters, credentials, or personal data in the deployed PWA.

## What was fixed in this review

- Removed the production-host 404 guard from `/explore-app`; direct private review now works after deployment.
- Removed the two public calls to action from `/climbers-lounge`.
- Changed the legacy `/start` redirect to `/climbers-lounge`.
- Kept the PWA manifest, offline registry, and service worker because they are part of the deliberate private-by-link experience.
- Added build-time data synchronization to both named build commands so a clean checkout does not build against a missing `website/public/data/v1` mirror.
- Added the content workflow, folder map, media matrix, record template, surface matrix, and QA gate in this handoff folder.

## Verified starting surfaces

| Surface | Intended state | Review note |
| --- | --- | --- |
| `/` | Public photography site | No Explore app CTA in the public homepage surface. |
| `/climbers-lounge` | Public Coming Soon bridge | No link to the private PWA or catalog. |
| `/start` | Legacy public bridge | Redirects to `/climbers-lounge`. |
| `/explore-app` | Private-by-link PWA | Noindex; share directly only. |
| `/explore` | PWA atlas | Noindex development stream; linked from inside the PWA. |
| `/panoramas/wachau` | PWA panorama surface | Direct route works and keeps Region / Crag / Sector / 360 controls. |

## Current content spine

The existing registry contains six workspace boxes: `Steep Ground`, `Nasenwand Routes`, `Wachau Panorama`, `Crag Locator`, `Nasenwand 3D`, and `Wall Reveal`. The current motion spine has three chapters: Region to Rock, Rock to Sector, and Sector to Topo. The canonical route data path is:

```text
database/master/vertical-moment-canonical.json
        -> database/api/v1/
        -> website/public/data/v1/
        -> Atlas and PWA consumers
```

The first content slice should be one verified vertical slice: `Wachau -> Nasenwand -> Upper`, because it already connects the spatial card, panorama, model, wall reveal, and route workspace. This is a sequencing recommendation, not a claim that missing climbing facts are verified.

## Next agent entry point

Read the files in this order:

1. `README.md` (this file)
2. `CONTENT_WORKFLOW.md`
3. `FOLDER_MAP.md`
4. `MEDIA_SPECIFICATIONS.md`
5. `SURFACE_MATRIX.md`
6. `CONTENT_RECORD_TEMPLATE.json`
7. `QA_CHECKLIST.md`
8. `NEXT_AGENT_TASK.md`

The next agent should work in a new `pwa/<task>` branch from the then-current `main`, update one content slice, run the QA checklist, and stop at a reviewable PR. Do not merge, deploy, redesign, or expose the PWA publicly without a separate owner decision.
