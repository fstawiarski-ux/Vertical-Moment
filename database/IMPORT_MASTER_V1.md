# Master v1 import

Imported on 2026-07-28 as a preserved baseline. No Notion request, create, update or delete operation is authorized by this import.

## Contents

- Master workbook: 2,416 rows in `Routes`.
- Generated API export: 2,416 records, with the same Row Key set as the workbook.
- Safe create candidate file: 1,425 rows, retained for future review only.
- Höllental reconciliation: 359 rows (209 existing database matches and 150 potential new rows); 35 matched grades differ.
- Höllental database-only report: 37 rows.

## Operational rules

1. Preserve the imported files as Master v1; do not hand-edit `generated/routes_v1.json`.
2. Treat `Row Key` (`Area | Wall | Route`) as the import identity, not as a final universal route ID.
3. Do not create external records from `push_ready_to_create.csv` without an explicit, separately approved reconciliation and publication task.
4. Keep all Höllental data in review status until source and field checks resolve the reconciliation reports.
5. Add new detailed records under `json/routes/`, preserving source evidence and verification status.

## Integrity hashes (SHA-256)

| File | SHA-256 |
|---|---|
| `master/vertical_moment_master_routes_v1.xlsx` | `AA007DB2F988BB9FECBD3628E1B450C57A676F1446058ED3814392E640146D50` |
| `generated/routes_v1.json` | `C3DC98C396063B356C97084DCBBE7663956F7E938C2F581B161F434195A8662D` |
| `imports/BUILD_README.md` | `53377122BF7E1D68D90EF2464409B6920E580DBEE1AB9D5BFF1FBC6890BAB4DE` |
| `reconciliation/push_ready_to_create.csv` | `81BE8B709F440C9CAF5D21DCA6DD6235BC201C7BEC86FF365C8DF89F8FE75189` |
| `reconciliation/helenental_reconciliation.csv` | `C32AB48FABCC4D204F5131F930CAECEE7E0A49CECF5EC768041D1132E20F074C` |
| `reconciliation/helenental_db_only.csv` | `74ED965A4E185206C498B362F1973DEB11A2A1FD94B0C9DE1B8A584A127A7D03` |
