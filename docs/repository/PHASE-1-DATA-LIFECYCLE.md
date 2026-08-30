# Phase 1 — Data lifecycle and legacy-source boundary

**Status:** working-copy contract; not a release contract

## Active data path

The active route path is intentionally one-way:

```text
database/master/vertical-moment-canonical.json
  → database/scripts/build_api.py
  → database/api/v1/
  → website/scripts/sync-data.mjs
  → website/public/data/v1/
  → website/app/(platform)/explore/atlas-data.json
```

The current approved working copy has 2,390 active routes, 330 crag records,
20 regions, and 1492 routes with coordinates. The 12 Matterhörndl records
removed from that active set are in
`database/archive/phase1-quarantine/matterhorndl-routes-20260830.json`.

## What is historical or review-only

These files are not alternate active sources and must not be silently merged
into the canonical dataset:

- `database/archive/phase1-legacy-route-sources-20260830/`: preserved Master V1
  and Wachau import lineage. It is historical evidence, not an active source.
- `website/_archive/phase1-legacy-snapshots-20260830/`: the superseded compact
  website projections.
- `website/app/(platform)/data/routes.json` and `crags.json`: compatibility
  projections regenerated from the canonical source for legacy components.
- `website/app/(platform)/data/review-routes.json`: separate reconciliation
  overlay, not published truth.
- `areas/helenental/pilot/`: a bounded intake/pilot workflow. Its manifest may
  reference Master V1 to describe comparison material, but promotion still
  requires evidence review and a canonical update.

Historical files remain valuable for comparison, rollback, and provenance.
Their presence is not by itself evidence that the active website consumes them.

## Cleanup rule

Before moving or deleting any legacy dataset, identify its code consumer and
replace that consumer with either the canonical/API path or an explicitly
named review path. Preserve the original file, checksum, and source path in a
quarantine or archive record until the consumer map is verified.

## GPS policy

The website has intentional GPS consumers in the field-report and crag-map
surfaces. The security header now allows geolocation for the same origin only
with `geolocation=(self)`, while camera and microphone remain disabled. The
browser still requires HTTPS where applicable and an explicit user permission;
the site does not receive GPS silently.
