# Database

## Current baseline

`master/vertical-moment-canonical.json` is the active source of truth for the generated API tree at `api/v1/`. In this approved local working copy, the active set contains 2,390 routes after the reversible quarantine of 12 Matterhörndl records. The old workbook is archived under `archive/phase1-legacy-route-sources-20260830/master/` and is not read by the current API build.

The decision record in [`docs/architecture/ADR-0002-canonical-route-source.md`](../docs/architecture/ADR-0002-canonical-route-source.md) records why the pre-quarantine 2,402-route JSON was selected and why the older 2,416-row and 2,314-row datasets remain staging/review material. The current working-copy delta is recorded in [`docs/repository/PHASE-1-CANONICAL-SOURCE-REGISTER.md`](../docs/repository/PHASE-1-CANONICAL-SOURCE-REGISTER.md).

`reconciliation/` contains review aids only. They must not be treated as automatic canonical imports. A reviewed change must update the canonical JSON first, then regenerate and validate the API tree.

## 2026-08-01 guidebook reconciliation

`reconciliation/guidebook-review-2026-08-01/` is the owner-approved source-review batch prepared for draft-PR inspection. It contains evidence-linked route rows with deterministic states: aligned, grade-conflict hold, OCR hold, taxonomy hold, or new candidate.

The batch does not modify the master workbook, canonical JSON, generated API, or website mirror. Canonical import and publication remain separate approval gates. The reusable review and extraction workbooks are preserved under `imports/guidebook-review-2026-08-01/`; raw guidebook images are deliberately excluded.

## Next layer

`json/routes/` is the richer, per-route record format for new or field-verified work. It has stable IDs, source evidence, and verification status. It will be progressively linked to Master v1 rather than replacing the imported baseline without review.
