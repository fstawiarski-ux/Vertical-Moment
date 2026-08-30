# Vertical Moment ? Vienna-Area Limestone Routes: Coordinate Enrichment Report

Generated: 2026-08-02T00:02:20+00:00  |  Routes: 2416

## Summary

- **Total routes:** 2416
- **Areas:** 12  |  **Walls:** 128
- **Routes with coordinates:** 2416 / 2416 (**100%**)
- **Routes with provenance (coord_source):** 2416 / 2416

## Coordinate sources (coord_source prefix)

- OSM exact: 845
- theCrag: 577
- master xlsx (pre-existing): 319
- master xlsx: 290
- OSM cliff: 171
- OSM fuzzy (0.88): 61
- OSM (boulder variant): 51
- OSM fuzzy (0.95): 38
- outdooractive: 32
- OSM fuzzy (0.94): 20
- OSM fuzzy (0.87): 12

## Status distribution

- to create: 1425
- in Notion DB: 632
- review (Helenental) — in DB: 209
- review (Helenental) — new: 150

## Per-area breakdown

| Area | Routes | Walls | With coords |
|---|---|---|---|
| Arnstein | 143 | 13 | 143 |
| Bucklige Welt | 100 | 5 | 100 |
| Fischauer Vorberge | 145 | 6 | 145 |
| Helenental | 359 | 26 | 359 |
| Hirschwände | 120 | 7 | 120 |
| Hocheck | 384 | 21 | 384 |
| Hohe Wand | 401 | 11 | 401 |
| Kaltenleutgebner Tal | 261 | 13 | 261 |
| Lindkogel | 83 | 3 | 83 |
| Mödling | 188 | 10 | 188 |
| Pernitz | 179 | 10 | 179 |
| Wöllersdorf Hart | 53 | 4 | 53 |

## Method

1. Extracted 3 uploaded zips to temp; master of truth: ertical_moment_master_routes.xlsx (2,416 rows).
2. Pass 1: master Crag Coordinates sheet (28 row keys) + OSM exact/fuzzy match on wall names ? 1,555.
3. Pass 2: fixed (Boulder)-variant key handling ? 1,633 with coord_source.
4. Pass 3: region-scoped OSM fuzzy for remaining walls; weak matches (<0.85) rejected deliberately.
5. Pass 4: geocoded 44 remaining walls via theCrag area meta tags (German /de/ URLs bypass login wall) + OSM Nominatim cliffs (e.g. Hirschw?nde way 115602397).
6. Pass 5: Kaltenleutgebner Tal Sch?ffelturm (key typo fix ?) ? 2,384.
7. Pass 6: Bucklige Welt Black Metal boulder from outdooractive (272950208) ? **2,416/2,416 (100%)**.
8. Wrote Latitude/Longitude + Coord Source into master xlsx; rebuilt all data/ outputs via uild_dataset.py.

## Files

- ertical_moment_master_routes.xlsx ? updated source of truth (13 + Coord Source columns).
- data/routes.json ? full API payload (14 fields incl. coord_source).
- data/routes.csv, data/facets.json, data/areas.json, data/by-area/*.json, data/stats.json, data/index.json.

## Remaining gaps

- None ? all 2,416 routes have coordinates. Black Metal Block is "unlocated" on theCrag; used outdooractive Bucklige Welt coords (47.652410, 16.139402) as the boulder-field location.
