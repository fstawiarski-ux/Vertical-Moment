# Database

## Current baseline

`master/vertical_moment_master_routes_v1.xlsx` is the preserved Master v1 baseline. Its `Routes` sheet is the current source for the companion generated API payload at `generated/routes_v1.json`.

`reconciliation/` contains review aids only. In particular, Höllental must not be pushed or auto-created from these files; see `IMPORT_MASTER_V1.md`.

## Next layer

`json/routes/` is the richer, per-route record format for new or field-verified work. It has stable IDs, source evidence and verification status. It will be progressively linked to Master v1 rather than replacing the imported baseline without review.
