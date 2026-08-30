# Phase 1 legacy route-source archive

This archive contains the superseded 2,416-row route-data lineage that was
previously mixed into the repository beside the active canonical source.

## Archived material

- `master/vertical_moment_master_routes_v1.xlsx`: original Master V1 workbook.
- `generated/routes_v1.json`: generated Master V1 route export.
- `imports/2026-08-02-wachau/`: the related Wachau import package, including
  JSON, CSV, workbook, statistics, crag data, and session notes.

## Why it is not canonical

The active authority is
`database/master/vertical-moment-canonical.json`. The archived route export
contains 2,416 rows, while the approved local active set contains 2,390 routes.
Across the 2,390 matching active row keys, the 2,416-row coordinate export
disagrees with the canonical coordinates on 316 mapped routes, including 101
differences over 100 metres. It is therefore preserved as historical evidence,
not merged automatically.

The original files were moved locally, not deleted. Their historical hashes
remain recorded in `database/IMPORT_MASTER_V1.md` and the related handoff
material.
