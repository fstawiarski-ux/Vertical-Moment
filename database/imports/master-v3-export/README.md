# Master v3 export archive

`vertical_moment_master_export_bundle.zip` is an immutable reference export received on 2026-07-28. It contains a richer but smaller historical dataset:

- 782 total records
- 632 route records
- 72 coverage-register records
- 78 guidebook-photo-source records
- CSV, JSON, JSONL, SQLite, workbook and schema exports

## Relationship to Master v1

Master v1 remains the active repository baseline because it contains 2,416 route records and has already been validated as the current working dataset. Do **not** replace Master v1 with this archive and do not merge its route data automatically.

Master v3 is valuable evidence for route history, coverage tracking and guidebook-photo provenance. Any future reconciliation must match by stable source identifiers and Row Key, report additions/updates/conflicts, and be approved before changing canonical records.

The bundle includes several workbook variants and large `.inspect.ndjson` files. Keep it archived intact; extract only the necessary data in a dedicated reconciliation task.
