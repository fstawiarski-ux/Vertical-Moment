# Database

## Current baseline

`master/vertical_moment_master_routes_v1.xlsx` is the preserved Master v1 baseline. Its `Routes` sheet is the current source for the companion 2,416-route API payload at `generated/routes_v1.json`.

`reconciliation/` contains review aids only. They must not be treated as automatic master imports.

## 2026-08-01 guidebook reconciliation

`reconciliation/guidebook-review-2026-08-01/` is the owner-approved source-review batch prepared for draft-PR inspection. It contains 188 evidence-linked route rows with deterministic states: aligned, grade-conflict hold, OCR hold, taxonomy hold, or new candidate.

The batch does not modify the master workbook, generated canonical JSON, or the website's existing 632-route snapshot. Canonical import and publication remain separate approval gates. The reusable review and extraction workbooks are preserved under `imports/guidebook-review-2026-08-01/`; raw guidebook images are deliberately excluded.

## Next layer

`json/routes/` is the richer, per-route record format for new or field-verified work. It has stable IDs, source evidence, and verification status. It will be progressively linked to Master v1 rather than replacing the imported baseline without review.
