# Wachau GPX → Vertical Moment — Session Handoff

Condensed handoff for session **"Wachau climbing GPX data extraction"** (`ses_0408b1bd8ffek5YdnWDX7ncoVf`), run overnight **2026-08-01 → 2026-08-02** in workspace **OpenWork Chat** (`C:\Users\ineedbooze\OpenWork Chat`).

The tab can no longer be opened in the OpenWork UI (shows "expired" — server-side lookup fails). This file preserves the method and output inventory for future chats. A 263-message transcript was historically referenced as `reports\wachau-session-recovery.md`, but that transcript is **not committed in this repository**; do not treat the old path as a recoverable repo link.

## 1. Goal

1. Extract as much climbing data as possible for the **Wachau** area from the uploaded sources (GPX + docx + CSV), organized as **Areas / Crags-Rocks / Sectors** with GPS, distance, elevation, and other metrics → a document suitable for the user's app + website (API sync, future updates; empty fields where info is missing).
2. Apply the same dedup/merge/coordinate-enrichment method to the **Vertical Moment** Vienna-area limestone route dataset (**2,416 routes** from `master4.zip`) and update the master files.

## 2. Inputs (all still on disk)

| Source | Location |
|---|---|
| `WACHAULOCATIONS.gpx` (88 waypoints, creator mapy.com) | `.opencode\openwork\inbox\chat-attachments\ses_0408b1bd8ffek5YdnWDX7ncoVf\b040de66-…-WACHAULOCATIONS.gpx` |
| `Wachau_Duernstein_rozdzial (1).docx` (guidebook chapter: 38 sectors, 3 groups, sun/aspect) | same folder → `7150481438f9e94c-…docx` |
| `terrain.csv` (aspect/slope/elevation, WAC ids) | same folder |
| `GPXallfiless.zip` (api_bundle.json = 254 crags/126 routes, crags.geojson, missing_from_notion.csv = 196, vertical_moment_osm_master.xlsx) | same folder + extracted to `%TEMP%\opencode\GPXallfiless\` |
| `master4.zip` (BUILD_README.md, routes.json = 2,416, vertical_moment_master_routes.xlsx = 2,416 rows, push_ready_to_create.csv = 1,425, helenental_reconciliation.csv, helenental_db_only.csv) | same folder + extracted to `%TEMP%\opencode\master4\` |
| `filesmasterroutesapi.zip` (632-row in-Notion subset xlsx, helenental_gapfill_REVIEW.csv = 51 NEW) | same folder + extracted to `%TEMP%\opencode\filesmasterroutesapi\` |
| 349 photos `IMG_5777`–`IMG_6276` (157 byte-identical "Copy" dupes → **192 unique**) | same folder |

## 3. Method

### A. Wachau extraction — DONE
1. Parse GPX waypoints (WGS84 lat/lon, 6 decimals ≈ 0.1 m accuracy).
2. Dedupe 88 waypoints → **84 unique locations** (18 duplicates removed); merge with docx (38 sectors, 3 groups) + terrain.csv (aspect/slope/elevation).
3. Group into **7 areas**; normalized IDs (`WACHAU_xxx` / `CRAG_xxx` / `WPT_xxx`) for API references.
4. Pulled the **13 missing sector coordinates from theCrag meta tags** (built-in browser, `/de/` URLs — webfetch returns 403).
5. Outputs: JSON (areas → sectors → crags hierarchy + `api_schema`), summary.md, crags.csv (UTF-8 BOM).
6. **Result:** 7 areas, 84 sectors, 84 unique locations, 53 routes, elevation 268–695 m, rock type Gneis. Unknown fields (grades, first ascent, approach, season…) left `null`/empty for later updates.

### B. Vertical Moment coordinate enrichment — DONE (100% coverage)
Per `BUILD_README.md`: single source of truth = `master4\vertical_moment_master_routes.xlsx` sheet **Routes**; never hand-edit generated `data/`; rebuild with `python3 build_dataset.py [master.xlsx] [out_dir]` (idempotent). Row Key = `Area | Wall | Route`; Status = `in Notion DB` / `to create`.

1. Coordinate fill passes (intermediate: `%TEMP%\opencode\vm_routes_processed.json`):
   - **Pass 1:** master xlsx "Crag Coordinates" sheet (28 row keys) + OSM exact/fuzzy → **1,555**
   - **Pass 2:** fixed "(Boulder)"-variant key bug → **1,633** + `coord_source` tags added
   - **Pass 3:** region-scoped fuzzy (conservative, only strong hits) → few; left unfilled rather than risk wrong coords
   - **theCrag (browser) + OSM Nominatim:** 44 walls / 747 routes geocoded (wall-level coord per area, source recorded per route)
   - **Final gaps:** Schöffelturm (Kaltenleutgebner Tal, 4 routes; `ä`→`ö` typo fix) and Black Metal boulder (Bucklige Welt, 32 routes; boulder-field area coords from outdooractive) → **2,416/2,416 (100%)**
2. **Recreated `build_dataset.py`** (missing from all zips — only the README spec described it): reads master xlsx → `routes.json`, `routes.csv`, `facets.json`, `areas.json`, `by-area/<slug>.json` (12 areas), `stats.json`, `index.json`; umlaut-folded slugs (ö→oe); idempotent. Ran successfully.
3. **Provenance:** all 2,416 routes carry `coord_source` — OSM exact 845, theCrag 577, master xlsx 290 + 319 pre-existing, OSM cliff 171, OSM fuzzy 131, OSM boulder-variant 51, outdooractive 32.

### C. Photos — PARTIAL (blocked on vision)
- 349 JPGs (282 MB) → 157 byte-identical duplicates → **192 unique** copied to workspace `photos\` with `photos\photo_manifest.csv` (source UUID → clean name).
- EXIF **stripped**: no GPS, no DateTime, no camera model → no automatic geo-matching possible.
- The model in use (`big-pickle`) has **no image input** → photo→route matching **NOT done**. Needs a vision-capable model (**Settings → AI Providers**).

## 4. Outputs (workspace, all validated)

| File | Description |
|---|---|
| `reports\wachau-climbing-data.json` | Merged master (7 areas / 84 sectors / 84 locations / 53 routes) + api_schema — validates ✓ |
| `reports\wachau-climbing-summary.md` | Human-readable per-area summary + data-gap table |
| `reports\wachau-climbing-crags.csv` | Flat 84-row table (UTF-8 BOM) |
| `reports\vertical-moment-routes.json` | Full API payload — **2,416/2,416 routes with coords** (validated ✓) |
| `reports\vertical-moment-routes.csv` | Flat export |
| `reports\vertical-moment-master-routes.xlsx` | Updated master (2,416 rows × 14 cols incl. **Coord Source**) |
| `reports\vertical-moment-stats.json` | Dashboard counts |
| `reports\vertical-moment-enrichment-summary.md` | Per-area coverage before/after + method |
| `reports\build_dataset.py` | Reproducible builder (also in `%TEMP%\opencode\master4\`) |
| `photos\` (192 JPGs) + `photo_manifest.csv` | Deduped photo library |
| `reports\wachau-session-recovery.md` | Historical external/missing reference; not committed in this repository |

Other artifacts: `%TEMP%\opencode\vm_routes_processed.json` (coord-fill intermediate), `%TEMP%\opencode\photo_exif.json` (EXIF scan), original master backed up as `vertical_moment_master_routes.xlsx.ORIGINAL.xlsx`.

## 5. Status & pending

- **DONE:** Wachau extraction; VM enrichment 2,416/2,416 with provenance; `build_dataset.py` recreated & run; photos deduped & organized.
- **PENDING (from the original session todo):**
  1. **Photo → route matching** — blocked: needs a vision-capable model, or the user describes which photos belong to which wall/route.
  2. **Notion push** — `push_ready_to_create.csv` = **1,425 net-new routes staged, NOT pushed** (dedup verified against live Notion DB; safe to create when the user confirms).
  3. (Optional) Fill remaining empty fields (grades, first ascent, approach, etc.) from Austrian guides.

## 6. Key decisions / caveats

- Never hand-edit generated `data/`; rebuild via `build_dataset.py`.
- Original `master4` xlsx backed up as `.ORIGINAL.xlsx` before promoting the updated one as source of truth.
- `coord_source` is an additive 14th column; consumers should ignore unknown fields.
- **Black Metal** coords are boulder-field/area-level (no precise point exists in any source) — flagged in the summary.
- theCrag blocks webfetch (403) and throttles (`?throttled=1`) → use the built-in browser; use `/de/` URLs when `/en/` redirects to a login wall.
- **GitHub note:** repo `fstawiarski-ux/Vertical-Moment` was **not touched** by this session (zero git commands ran; last push 2026-08-01 19:23Z predates the session; local clone at `.gemini\antigravity\scratch\Vertical-Moment` is clean & in sync).

## 7. Continue here

1. Read this file first.
2. Verify the outputs exist and validate (JSON parses, counts match the table above).
3. Pick up the pending items (photo→route matching with a vision model, or the staged Notion push).
4. If more context is needed, search the original OpenWork recovery storage for `wachau-session-recovery.md`; do not assume it exists in this repository.
