# Database

## Current baseline

`master/vertical-moment-canonical.json` is the active source of truth for the generated API tree at `api/v1/`. The workbook at `master/vertical_moment_master_routes_v1.xlsx` remains a preserved import baseline and is not read by the current API build when the canonical JSON exists.

`reconciliation/` contains review aids only. They must not be treated as automatic canonical imports. A reviewed change must update the canonical JSON first, then regenerate and validate the API tree.

## 2026-08-01 guidebook reconciliation

`reconciliation/guidebook-review-2026-08-01/` is the owner-approved source-review batch prepared for draft-PR inspection. It contains evidence-linked route rows with deterministic states: aligned, grade-conflict hold, OCR hold, taxonomy hold, or new candidate.

The batch does not modify the master workbook, canonical JSON, generated API, or website mirror. Canonical import and publication remain separate approval gates. The reusable review and extraction workbooks are preserved under `imports/guidebook-review-2026-08-01/`; raw guidebook images are deliberately excluded.

## Next layer

`json/routes/` is the richer, per-route record format for new or field-verified work. It has stable IDs, source evidence, and verification status. It will be progressively linked to Master v1 rather than replacing the imported baseline without review.
