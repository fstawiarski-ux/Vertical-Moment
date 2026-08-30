# Phase 1 — Canonical Source Register

**Status:** working-copy baseline; not a release contract yet
**Snapshot reviewed:** supplied `Vertical-Moment-main.zip`
**Authority:** this document records the audit position; it does not override code or data

## Purpose

Make the product/data chain unambiguous before any legacy material is moved or removed.

## Current intended chain

```text
database/master/vertical-moment-canonical.json
  → database/scripts/build_api.py
  → database/api/v1/
  → website/scripts/sync-data.mjs
  → website/app/(platform)/explore/atlas-data.json
  → website/public/data/v1/   [generated/deployment output]
```

## Source classification

| Path or family | Provisional class | Consumer / role | Cleanup rule |
|---|---|---|---|
| `database/master/vertical-moment-canonical.json` | canonical candidate | active product data pipeline | preserve; validate directly |
| `database/api/v1/` | generated | API consumers | regenerate; do not hand-edit |
| `website/app/(platform)/explore/atlas-data.json` | generated bridge | Explore/PWA | regenerate; verify parity |
| `website/public/data/v1/` | generated/deployment | published web data | verify provenance before changing |
| older Master v1/v4 material | historical or staging candidate | reconciliation/reference | preserve until consumers are proven absent |
| `website/app/(platform)/data/routes.json` | legacy candidate | older website path | do not delete until route consumers are mapped |
| review overlays | review/provisional | reconciliation workflow | keep separate from published truth |
| LFS pointer files | source-master pointer | media/models/assets | preserve until underlying objects are verified |

## Required validation before structural cleanup

- required fields and allowed values are checked in the active canonical JSON;
- canonical/API/Explore route ID sets are equal;
- field-level parity covers status, grade, coordinates, provenance and rights fields;
- generated outputs record their source revision and generation time;
- legacy counts and descriptions are corrected or explicitly labelled historical;
- coordinate absence remains visible and is never filled with invented data;
- LFS pointers and their consumers are mapped;
- the geolocation response policy is reconciled with the GPS UI; the local
  working copy permits same-origin geolocation only.

## Verification finding from the working copy

Before quarantine, the canonical JSON and API output had matching route IDs and matching mapped fields for all 2,402 routes. The Explore bridge also had all 2,402 IDs, but its coordinates were not fully current: 12 Matterhörndl routes had null coordinates in the canonical/API records and still carried 48.014969, 16.049373 in atlas-data.json. After the approved local quarantine, the active chain has 2,390 matching route IDs; the 12 records are preserved separately and are not treated as corrected data.

This was a generated-output freshness issue, not permission to invent or promote coordinates. The approved working copy regenerated the bridge-equivalent data after backing it up; the stale MatterhÃ¶rndl coordinates are now null and the active bridge route IDs match the canonical/API set.

## Approved working-copy quarantine

The owner approved the 12 Matterhörndl route records for temporary removal from the active working-copy chain. They are preserved in `database/archive/phase1-quarantine/matterhorndl-routes-20260830.json`. Active route totals are now 2,390 overall and 176 for Mödling; the Matterhörndl crag remains as an empty location record. This is reversible quarantine, not permanent deletion and not a live release.

## Important boundary

This file is a Phase 1 working-copy record. It does not authorize deletion, publication, deployment or live GitHub changes. Historical material must be archived with an original-path and rollback record before any later deletion proposal.
