# ADR-0002: Use the 2,402-route canonical JSON as the active route source

**Status:** Accepted

**Date:** 2026-08-15

**Decider:** Vertical Moment owner

## Context

Vertical Moment contains several route-shaped datasets with similar fields but
different histories and coverage:

- `database/master/vertical-moment-canonical.json` contains 2,402 routes,
  330 crags and 20 regions.
- `database/generated/routes_v1.json` and the preserved Wachau import contain
  the older 2,416-row Master v1 baseline.
- The 2026-08-09 alignment report describes a separate 2,314-row `Master_v4`
  workbook. It has useful review fields, but it is not a safe replacement:
  exact row-key matching against the 2,402-route baseline is only 27.3%, five
  baseline regions disappear entirely, and formatting changes break many
  deterministic identities.
- `website/app/(platform)/data/routes.json` is a separate 632-route website
  snapshot and is not the PWA atlas source.
- `database/api/v1/`, `website/public/data/v1/`, and
  `website/app/(platform)/explore/atlas-data.json` are generated consumers.

The platform needs one active route source, stable IDs, reproducible builds,
and a way to preserve older or newly extracted rows without silently replacing
verified or reviewable data.

## Decision

Use `database/master/vertical-moment-canonical.json` as the active canonical
route source for the platform.

The required publication chain is:

```text
database/master/vertical-moment-canonical.json
  -> database/scripts/build_api.py
  -> database/api/v1/
  -> website/scripts/sync-data.mjs
  -> website/public/data/v1/
  -> website/app/(platform)/explore/atlas-data.json
  -> Explore PWA consumers
```

The 2,416-row Master v1 material, the 2,314-row Master v4 workbook, review
exports, and the 632-route website snapshot remain preserved evidence or
staging inputs. They may contribute rows only through a separately reviewed
reconciliation that updates the canonical JSON and regenerates every mirror.

Nasenwand-specific working content remains in the PWA content layer until its
route identity, source, rights, location, and geometry are reviewed. It must
not be merged into the canonical route dataset merely because its names or
grades look compatible.

## Options considered

### Option A: 2,402-route canonical JSON — chosen

- Already declared as canonical by repository documentation and the API builder.
- Already drives the generated API, website mirror, and current Explore atlas.
- Has stable IDs, source/provenance fields, region/crag structure, and current
  verification flags.
- Supports deterministic regeneration and byte-level mirror verification.

### Option B: 2,416-row Master v1 baseline — preserved, not active

- Useful historical import baseline with broader row count.
- Its generated output belongs to an older data pipeline and does not drive the
  current API.
- Promoting it would reintroduce a second build path and require a full
  reconciliation rather than a simple file swap.

### Option C: 2,314-row Master v4 workbook — staging only

- Contains useful operational columns such as media, 3D, website and QA state.
- Exact row-key alignment is too low for an unattended replacement.
- It drops or renames large parts of the baseline and introduces new regions.
- It must be reconciled in bounded batches with source evidence.

### Option D: 632-route website snapshot — not canonical

- It is a legacy review/site snapshot, not the current atlas dataset.
- It cannot represent the current 20-region, 330-crag route system.

## Consequences

- Future route additions target the canonical JSON only after evidence review.
- Generated API files and website mirrors must never be hand-edited.
- The 2,314/2,416 datasets remain available for comparison and staged import.
- Content records can reference route IDs without claiming that media, GPS,
  access, or geometry are verified.
- A source mismatch becomes a review item instead of an implicit merge.
- The PWA and public site can continue using the same generated route tree while
  keeping provisional Nasenwand media separate.

## Action items

1. [x] Record the active canonical source and the historical alternatives.
2. [x] Add an automated source/API/mirror/atlas consistency check.
3. [ ] Reconcile the 2,314-row workbook in bounded, evidence-linked batches.
4. [ ] Add reviewed Wachau/Nasenwand records through the private intake flow.
5. [ ] Re-run canonical generation, mirror sync, tests and device QA after each
   approved content batch.
