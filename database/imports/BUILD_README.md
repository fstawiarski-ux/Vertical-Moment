# Vertical Moment — routes dataset

Single source of truth: **`vertical_moment_master_routes.xlsx`** → sheet `Routes`.
Everything in `data/` is generated from it by `build_dataset.py`. Never hand-edit
`data/`; edit the master and rebuild.

Currently **2,416 routes** across **12 areas / 129 walls**.

## Master workbook

Columns (order matters — the build reads by header name):

`Route · Grade · Grade band · Discipline · Grade system · Area · Wall · Source ·
Latitude · Longitude · Row Key · Notion Page ID · Status`

- **Row Key** = `Area | Wall | Route` — the stable identity used to match against
  Notion on push (create if new, update if the key already exists).
- **Grade band**: `1-4`, `5-7`, `8-11`, or `Boulder` (derived from the leading grade number).
- **Discipline**: `sport`, `boulder`, `multipitch`.
- **Status**: `in Notion DB` (already live) or `to create` (staged, not yet pushed).

## Generated files (`data/`)

| File | Use |
|---|---|
| `routes.json` | Primary API payload — `{meta, routes:[…]}`, all objects. |
| `routes.csv` | Flat import / spreadsheet. |
| `facets.json` | Website filter options + counts (areas, walls, grade bands, disciplines, systems, sources, statuses). |
| `areas.json` | Nav tree: area → walls → counts + discipline split. |
| `by-area/<slug>.json` | Per-area route lists for lazy loading. |
| `stats.json` | Dashboard summary counts. |
| `index.json` | Manifest listing every file + counts (API discovery). |

JSON uses snake_case fields; UTF-8 throughout. Slugs fold umlauts (ö→oe) for safe filenames/URLs.

## Rebuild

```
python3 build_dataset.py [master.xlsx] [out_dir]   # defaults: master in cwd, out=data/
```

Idempotent — overwrites `data/` only.

## Adding future pages (repeatable workflow)

1. Transcribe the new spread(s) to `Route + Grade` per wall (topo numbers don't matter —
   Row Key is name-based).
2. Append rows to the `Routes` sheet with `Status = to create`, `Grade system` = `UIAA`
   (or `Font` for boulders), and a per-wall unique name for `Namenlos`/`Projekt`
   entries so Row Keys stay unique.
3. If a new **Area** appears, add a row to the `By Area` sheet
   (`=COUNTIF(Routes!$F$2:$F$<last>, A<n>)`) and extend the `TOTAL`.
4. Run `build_dataset.py`.

## Open items to confirm before any Notion push

- **Source** is defaulted to `Österreich Ost` for all 1,784 staged rows — set a
  real book value if wanted (one find-replace).
- **Region labels** `Hocheck`, `Pernitz`, `Hirschwände`, `Arnstein` are inferred; the
  Triestingtal / Hohe-Wand overviews may group differently. `Hausstein` +
  `Haussteinmugal` may belong under `Pernitz` rather than `Hohe Wand`.
- **Helenental overlaps the existing Notion DB.** These 359 rows are staged `to create`
  but many already exist live — dedup on Row Key before pushing (do not blind-create).
- **Coordinates**: only 319 rows have lat/lon; the new areas need GPX.
- Dense sport walls are best-effort grade reads — worth a QC pass.

## Dedup against live Notion (push safety)

`build_dedup.py` matches the staged rows against the live Guidebook Routes DB
(fetched: Helenental + Hohe Wand/Flatzer Wand — the only DB areas that could
overlap the staged set). Outputs in `data/`:

| File | Meaning |
|---|---|
| `push_ready_to_create.csv` | **1,425 net-new rows** (Hohe Wand, Hocheck, Pernitz, Fischauer Vorberge, Arnstein, Hirschwände, Wöllersdorf Hart). Zero DB overlap — safe to create. |
| `helenental_reconciliation.csv` | My 359 Helenental rows: `exists_in_db` (209) vs `new_not_in_db` (150), with matched DB wall, DB grade, grade-differs flag, and Notion page ID. |
| `helenental_db_only.csv` | 37 live DB rows my transcription doesn't cover — DB-only wall "Ruachlerkamm", unnamed "(topo)"/"(?)" placeholders, and spelling mismatches (e.g. DB "Eiszunge"/"Latti" vs my "Beiszunge"/"Ratti"). |

Status column after dedup: `to create` (1,425 safe) · `in Notion DB` (632 original) ·
`review (Helenental) — in DB` (209, page IDs backfilled) · `review (Helenental) — new` (150).

**Push rule:** create only `Status == to create`. Hold all of Helenental — its live
DB copy is an earlier, differently-structured import (Beethoven split across two
walls; Rum/Dachs/Ospwandl as one wall of unnamed rows; Trenkerwand only 12 of 45),
so it needs a manual merge, not a blind create.
