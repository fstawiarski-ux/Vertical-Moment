# Vertical Moment — platform operations

How `app/(platform)` runs. Recovered from the `vmc-site` bundle (Aug 2026),
which was an earlier snapshot of this code; the bundle itself is superseded.

## Runtime dependencies

**Explore and the crag map need no database.** They are read-only over static
JSON, so `hosting.json` stays `{"d1": null, "r2": null}` until the contribution
pipeline actually goes live. Do not provision D1 or R2 just to ship the map.

**The map needs a network connection.** Leaflet and the CARTO basemap tiles load
from CDN at runtime. Everything else on the platform works offline.

## The data join

Markers on the map are the OSM crags. Colour encodes catalogue state:

- **gold** — the crag has transcribed routes attached
- **sage** — OSM knows the crag, no routes catalogued yet

Routes attach to crags by wall/crag name. Crags with no routes show a
"not catalogued yet" empty state — that is deliberate, and it is the hook the
contributor missions are built around. Every pin resolves to a real page.

## Contribution pipeline (dormant)

`db/schema.ts` is a Drizzle SQLite schema for Cloudflare D1, nine tables:
profiles, checklist_templates, checklist_template_items, missions,
mission_assignments, submissions, submission_answers, submission_files,
review_comments.

D1 has no row-level security, so authorization is enforced in the app/worker
layer — see `lib/identity.ts`, which reads the SIWC identity header.
`lib/r2.ts` is the dormant evidence-upload helper for submission files.

To activate: enable D1 in hosting config, then `npm run db:generate` for
migrations.

## Regenerating the data

Route and crag JSON is generated, never hand-edited. Source of truth is
`database/master/vertical-moment-canonical.json`; run
`python database/scripts/build_api.py` and the `database/api/v1/` tree rebuilds.
See `database/API_README.md`.

## Route discovery boundary

Public, indexable surfaces are `/`, `/climbers-lounge`,
`/prints/panoramas` and `/technology`. The print route is the public entry to
the panorama viewer and inquiry surface; the technology route is a plain-
language explanation of the shared build.

Private climbing surfaces are `/explore` and its region/crag descendants,
`/explore-app`, `/offline`, `/nasenwand-concepts` and
`/vision/wall-reveal`. They remain directly usable but emit `noindex` metadata
and are not included in the public sitemap.

`/contribute` and `/report` are the unlisted local-first contributor beta and
emit `noindex` metadata. `/review-preview` is a directly reachable internal
draft review surface and also emits `noindex`; it is not exposed in shared
navigation. `/start` remains a legacy redirect into `/explore-app?intro=skip`.
