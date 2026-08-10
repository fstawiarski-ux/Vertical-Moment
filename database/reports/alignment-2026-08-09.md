# Vertical Moment — data alignment report

**Generated:** 2026-08-09
**BASELINE:** `vertical-moment-canonical_1.json` (2,402 routes / 330 crags / 20 regions, generated 2026-08-09T09:19:01Z) — supplied via Downloads
**NEW:** `Vertical_Moment_Master_v4.xlsx`, sheet `Routes` (2,314 data rows, 35 columns) — `C:\Users\ineedbooze\OpenWork Chat\Vertical_Moment_Review\Master_v4\`
**Branch:** `fix/week1-launch-polish` — no files written to the repo's data tree by this analysis.

## Verdict up front

**This is not a clean additive update.** The row_key join rate is 27%. Five entire baseline regions (Hocheck, Pernitz, Arnstein, Hirschwände, Wöllersdorf Hart — 878 routes) are completely absent from NEW under any spelling. Helenental drops from 359 routes to 11. Separately, a systematic formatting change (route names went to ALL CAPS in several regions, `Adlitzgraben` became `Adlitzgraeben`) breaks the deterministic ID for roughly 1,600+ more rows even where the underlying climb is probably the same. Both effects are real and distinct — see sections 2.2/2.3. Per the brief: this contradicts Filip's stated claim, so it is reported as found, not silently corrected.

## Note on repo state

`database/master/` on this branch currently holds only `vertical_moment_master_routes_v1.xlsx` — the canonical JSON baseline described in the brief and in `VM-HANDOFF-status.md` is **not** committed. This matches the handoff doc's own "known gotcha": commit `55e9f8a` points `build_api.py` at `database/master/vertical-moment-canonical.json`, which isn't on disk. For this comparison the copy of that file from Downloads was used (`vertical-moment-canonical_1.json` — 2,402 routes / 330 crags / 20 regions, matching the brief's BASELINE description exactly). No files were added to the repo as part of this analysis.

## Step 1 — Inventory of NEW

**Sheets in the workbook:** README, Dashboard, **Routes** (the data sheet), Coverage Register, Area Summary, Wall Summary, Grade Summary, API Export, Import Queue, Data Dictionary, Lookups, Uploaded Coverage Summary, Guidebook Photo Sources (×4 batches, 16 sheets total).

**Routes sheet: 2314 data rows, 35 columns.**

| Column | Non-empty | Fill % |
|---|---:|---:|
| Route ID | 2314 | 100.0% |
| Route Name | 2314 | 100.0% |
| Grade | 2271 | 98.1% |
| Grade Band | 2268 | 98.0% |
| Discipline | 2314 | 100.0% |
| Grade System | 2314 | 100.0% |
| Region | 2314 | 100.0% |
| Area | 2314 | 100.0% |
| Crag | 1504 | 65.0% |
| Sector | 1090 | 47.1% |
| Wall | 2314 | 100.0% |
| Source | 2314 | 100.0% |
| Latitude | 2186 | 94.5% |
| Longitude | 2186 | 94.5% |
| Row Key | 2314 | 100.0% |
| Notion Page ID | 0 | 0.0% |
| Workflow Status | 2314 | 100.0% |
| Route Number | 0 | 0.0% |
| Book Page | 1445 | 62.4% |
| Book Edition | 2220 | 95.9% |
| Import Batch | 2314 | 100.0% |
| Verification Status | 2314 | 100.0% |
| Confidence % | 2314 | 100.0% |
| First Ascensionist | 214 | 9.2% |
| First Ascent Year | 44 | 1.9% |
| Length m | 84 | 3.6% |
| Stars | 1504 | 65.0% |
| Parent Route Key | 0 | 0.0% |
| Relationship Type | 0 | 0.0% |
| Last Updated | 2314 | 100.0% |
| GPS Status | 2314 | 100.0% |
| Media Status | 2314 | 100.0% |
| 3D Status | 2314 | 100.0% |
| Website Status | 2314 | 100.0% |
| QA Notes | 1709 | 73.9% |

**Distinct regions in NEW, with route counts:**

| Region | Routes |
|---|---:|
| Hohe Wand | 825 |
| Kaltenleutgebner Tal | 261 |
| Hoellental | 238 |
| Mödling | 190 |
| Neunkirchen | 111 |
| Puchberg | 104 |
| Fischauer Vorberge | 102 |
| Bucklige Welt | 100 |
| Lindkogel | 98 |
| Adlitzgraeben | 95 |
| Piestingtal | 43 |
| Höllental-Rax | 30 |
| Peilstein | 18 |
| Nowe rejony alpejskie (Odkryte w procesie redakcji) | 17 |
| Berchtesgaden | 12 |
| Wilder Kaiser | 12 |
| Helenental | 11 |
| Raisenmarkt | 8 |
| Wienerwald i okolice | 7 |
| Totes Gebirge | 6 |
| Rax i Schneeberg | 5 |
| Salzkammergut | 5 |
| Dachstein | 5 |
| Gesäuse i Haller Mauern | 4 |
| Hohe Tauern — Glockner | 4 |
| Puchberg Grünbach | 3 |

Two structural things stand out before any join is attempted:

- `Region` and `Area` are byte-identical on every one of the 2,314 rows — effectively one column typed twice.
- `Crag` (65% filled) is a strict subset of `Wall` (100% filled): everywhere `Crag` is filled, `Crag == Wall`. `Wall` is the complete field, and the sheet's own `Row Key` column turns out to be built as `Region | Wall | Route Name` (confirmed in 2.1) — so `Wall`, not `Crag`, is what plays the "Crag" role in the identity recipe. This matches the brief's note that older schemas map `Wall → Crag`.

## Step 2 — Alignment report

### 2.1 Join rate

Joined on the `Row Key` column already present in NEW. Verified first that `Row Key` equals `Region | Wall | Route Name` for all 2,314 rows with zero exceptions — so NEW's own key generation already implements the brief's `Region | Crag | Route` shape; no header remapping was needed.

| | Count | % of NEW (2314) | % of BASELINE (2402) |
|---|---:|---:|---:|
| **Matched** | 632 | 27.3% | 26.3% |
| Added (in NEW only) | 1682 | 72.7% | — |
| Dropped (in BASELINE only) | 1770 | — | 73.7% |

A 73% miss rate on both sides is far outside anything explainable by "some rows added, some columns filled in." Sections 2.2/2.3 separate how much of that is genuine new/lost content versus a formatting break, using a case/accent-insensitive re-join as a diagnostic (**not** used for the counts above, which are exact-match per the brief's identity rule).

Diagnostic: re-joining case- and accent-insensitively (ä→ae, ö→oe, ü→ue, ß→ss, lowercased) recovers 180 more matches (812 total, 35.1%/33.8%) — confirming that formatting noise (ALL CAPS route names, `Adlitzgraben` vs `Adlitzgraeben`) explains **only about 10%** of the gap. The other 90% is rows with no fuzzy counterpart at all in the other file.

### 2.2 Added rows

**1682** row_keys exist in NEW but not in BASELINE, grouped by region. "New region?" marks regions BASELINE never had at all (any route count, including the OSM-stub-only regions that had 0 routes):

| Region | Added routes | New region (not in BASELINE at all)? |
|---|---:|---|
| Hohe Wand | 825 | no — region exists in BASELINE |
| Hoellental | 238 | yes |
| Neunkirchen | 111 | no — region exists in BASELINE |
| Puchberg | 104 | yes |
| Fischauer Vorberge | 102 | no — region exists in BASELINE |
| Adlitzgraeben | 95 | yes |
| Piestingtal | 43 | no — region exists in BASELINE |
| Höllental-Rax | 30 | no — region exists in BASELINE |
| Peilstein | 18 | no — region exists in BASELINE |
| Nowe rejony alpejskie (Odkryte w procesie redakcji) | 17 | yes |
| Lindkogel | 15 | no — region exists in BASELINE |
| Berchtesgaden | 12 | yes |
| Wilder Kaiser | 12 | yes |
| Helenental | 11 | no — region exists in BASELINE |
| Raisenmarkt | 8 | yes |
| Wienerwald i okolice | 7 | yes |
| Totes Gebirge | 6 | yes |
| Dachstein | 5 | yes |
| Rax i Schneeberg | 5 | yes |
| Salzkammergut | 5 | yes |
| Gesäuse i Haller Mauern | 4 | yes |
| Hohe Tauern — Glockner | 4 | yes |
| Puchberg Grünbach | 3 | no — region exists in BASELINE |
| Mödling | 2 | no — region exists in BASELINE |

First 20 added row_keys:

- `Adlitzgraeben | Falkenstein | 100 JAHRE EINSAMKEIT`
- `Adlitzgraeben | Falkenstein | ABORTERKER`
- `Adlitzgraeben | Falkenstein | AFFENTANZ`
- `Adlitzgraeben | Falkenstein | ANARCHIE`
- `Adlitzgraeben | Falkenstein | ANGEL DUST`
- `Adlitzgraeben | Falkenstein | AUCH SPASS MUSS SEIN`
- `Adlitzgraeben | Falkenstein | AUSZUCKTE GFRASTER`
- `Adlitzgraeben | Falkenstein | AUTAG IN FRANKEN`
- `Adlitzgraeben | Falkenstein | AVIOPHOBIE`
- `Adlitzgraeben | Falkenstein | AZAK THOTH`
- `Adlitzgraeben | Falkenstein | BAUCHSCHUSS`
- `Adlitzgraeben | Falkenstein | BAUCHWEH`
- `Adlitzgraeben | Falkenstein | BIERBAUCH`
- `Adlitzgraeben | Falkenstein | BIS ZUM BITTEREN ENDE`
- `Adlitzgraeben | Falkenstein | BLAUBAUCH`
- `Adlitzgraeben | Falkenstein | BLIZZARD`
- `Adlitzgraeben | Falkenstein | BLOC ROCIN BEATS`
- `Adlitzgraeben | Falkenstein | BODY ENCOUNTER`
- `Adlitzgraeben | Falkenstein | BST EULEN`
- `Adlitzgraeben | Falkenstein | CHEAP SUNGLASSES`

Full list of 1682 added row_keys: see `added_rows_full.txt` alongside this report (not inlined — too long for the main document).

### 2.3 Dropped rows ⚠️

**1770 row_keys exist in BASELINE but not in NEW. Filip expects this to be ZERO. It is not.**

| Region | Dropped routes | Region present in NEW at all (any spelling)? |
|---|---:|---|
| Hohe Wand | 388 | yes, but under-populated (see below) |
| Hocheck | 384 | no |
| Helenental | 359 | yes, but under-populated (see below) |
| Pernitz | 179 | no |
| Fischauer Vorberge | 145 | yes, but under-populated (see below) |
| Arnstein | 143 | no |
| Hirschwände | 119 | no |
| Wöllersdorf Hart | 53 | no |

**Five regions are gone completely** — not renamed, not fuzzy-matched under another spelling, just absent: **Hocheck (384), Pernitz (179), Arnstein (143), Hirschwände (119), Wöllersdorf Hart (53)** — 878 routes, 36.5% of the base workbook's non-empty regions.

**Helenental is nominally still there but gutted**: 359 baseline routes → 11 in NEW.

**Hohe Wand and Fischauer Vorberge look additive on net count but aren't underneath**: Hohe Wand grew 388 → 825 and Fischauer Vorberge shrank 145 → 102, but in both cases the *original* baseline rows mostly did not survive the join — most of what "survived" did so only under the loose (case/accent-insensitive) match, meaning the same climbs are probably present but re-cased, which is a rename under the identity rule (2.7).

Full list of all 1770 dropped row_keys: see `dropped_rows_full.txt` alongside this report. First 40 shown here:

- `Arnstein | Alpinwandl | Alpine Aufnahmeprüfung`
- `Arnstein | Alpinwandl | Alpine Meisterprüfung`
- `Arnstein | Alpinwandl | Aussenseiterzwerg`
- `Arnstein | Alpinwandl | Der 7-Zwerg von links/rechts`
- `Arnstein | Alpinwandl | Giftzwerg`
- `Arnstein | Alpinwandl | Zwergenaufstand`
- `Arnstein | Alpinwandl | Zwergenk(r)ampf`
- `Arnstein | Alpinwandl | Zwergenmarathon`
- `Arnstein | Arnstein Hauptwand (Boulder) | Omo`
- `Arnstein | Arnstein Hauptwand (Boulder) | Zgonc`
- `Arnstein | Arnstein Hauptwand | Batzenfett`
- `Arnstein | Arnstein Hauptwand | Bruder Baum`
- `Arnstein | Arnstein Hauptwand | Burgfräulein`
- `Arnstein | Arnstein Hauptwand | Burgherr`
- `Arnstein | Arnstein Hauptwand | Cafe Bequem`
- `Arnstein | Arnstein Hauptwand | Der Lebensfaden`
- `Arnstein | Arnstein Hauptwand | Der weite Horizont`
- `Arnstein | Arnstein Hauptwand | Direkte Rampe`
- `Arnstein | Arnstein Hauptwand | Hals- und Steinbruch`
- `Arnstein | Arnstein Hauptwand | Hofnarr`
- `Arnstein | Arnstein Hauptwand | Im Vollrausch`
- `Arnstein | Arnstein Hauptwand | Kindervia`
- `Arnstein | Arnstein Hauptwand | Kleinigkeiten`
- `Arnstein | Arnstein Hauptwand | Linke Löcher`
- `Arnstein | Arnstein Hauptwand | Marriage Exorbitant`
- `Arnstein | Arnstein Hauptwand | Mayerfährte`
- `Arnstein | Arnstein Hauptwand | Melange`
- `Arnstein | Arnstein Hauptwand | Meteoritenschauer`
- `Arnstein | Arnstein Hauptwand | Minimundus`
- `Arnstein | Arnstein Hauptwand | Mojito`
- `Arnstein | Arnstein Hauptwand | Mutzsteig`
- `Arnstein | Arnstein Hauptwand | Nichtigkeiten`
- `Arnstein | Arnstein Hauptwand | Oh Mutzi`
- `Arnstein | Arnstein Hauptwand | Pausenfüller`
- `Arnstein | Arnstein Hauptwand | Rock Ballett`
- `Arnstein | Arnstein Hauptwand | Schattenreich`
- `Arnstein | Arnstein Hauptwand | Schneller als die Schwerkraft`
- `Arnstein | Arnstein Hauptwand | Serpentinen`
- `Arnstein | Arnstein Hauptwand | Sonne Mond und Sterne`
- `Arnstein | Arnstein Hauptwand | Sonnenkönig`

### 2.4 Columns filled — headline comparison (on the 632 matched rows)

This is the number Filip is expecting to see improve. On the 632 rows that *do* join cleanly, it does — modestly, and only for coordinates:

| Field | BASELINE filled | NEW filled | Δ |
|---|---:|---:|---:|
| Route Name | 632/632 | 632/632 | +0 |
| Grade | 629/632 | 629/632 | +0 |
| Grade Band | 627/632 | 627/632 | +0 |
| Grade System | 632/632 | 632/632 | +0 |
| Discipline | 632/632 | 632/632 | +0 |
| Crag (Wall) | 632/632 | 632/632 | +0 |
| Source | 632/632 | 632/632 | +0 |
| Latitude | 572/632 | 632/632 | +60 |
| Longitude | 572/632 | 632/632 | +60 |
| Notion Page ID | 0/632 | 0/632 | +0 |
| Workflow Status | 632/632 | 632/632 | +0 |
| Verification Status | 632/632 | 632/632 | +0 |

- **Coordinates**: +60 rows gained lat/lon on the matched set (572→632, 100% filled). This is the real, verifiable improvement.
- Every other shared field (name, grade, grade_band, grade_system, discipline, crag, source, workflow_status) is unchanged on matched rows — no regressions, no silent overwrites.
- `notion_page_id` is 0% in both — NEW's `Notion Page ID` column is entirely blank across all 2,314 rows, not just the matched subset.

**Columns that exist only in NEW** (no baseline equivalent — new capability, not a "fill rate improved" story since baseline never had the field): Book Page (62.4%), Book Edition (95.9%), First Ascensionist (9.2%), First Ascent Year (1.9%), Length m (3.6%), Stars (65.0%), Sector (47.1%), QA Notes (73.9%), plus workflow/QA tracking columns (GPS/Media/3D/Website Status, Confidence %, Import Batch — all 100%). `Route Number`, `Parent Route Key`, `Relationship Type` are present but entirely empty (0%).

### 2.5 Coordinate drift (matched rows only)

Of the 632 matched rows, **75** have both a BASELINE and a NEW coordinate that differ by more than 1m; **64** of those exceed the 10m threshold the brief calls a red flag. Filip says locations did not change.

- **Gained coordinates** (blank in BASELINE, present in NEW): **60** rows — expected and good, this is the 2.4 headline number.
- **Lost coordinates** (present in BASELINE, blank in NEW): **0** rows.

All drifted rows, most severe first:

| Distance | Row Key | BASELINE (lat, lon) | NEW (lat, lon) |
|---:|---|---|---|
| 16297.3m | `Mödling | Matterhörndl | Ostkamin` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Westriss` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Rechte Südkante` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Normalweg` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Westkamin` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Ostkante` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Nordkante` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Rampe` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Südostriss` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Nordwand` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Südwestriss` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 16297.3m | `Mödling | Matterhörndl | Nordwestwand` | (48.014969, 16.049373) | (48.0717616, 16.2514685) |
| 15.6m | `Mödling | Lausbubenwand | Pfeiler` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Riss (Nr 42)` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Excitation` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Falten und Strecken` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Alfis Übung` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Psycho I` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Streck Dich` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Hansisteig` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Machs Doch Schwer` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Klassiker` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Das Omen` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Beyond the Edge` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Projekt (Nr 2)` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Hidden Hole` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Asterix` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Uknudel` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Horror` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Prolo` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Nr 14` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Riss` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Öha` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Kamin` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Reichtvariante` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Erstiegener` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Miraculix` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Idefix` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Tränen für Irene` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Gipfelausstieg` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Lausbubenverschneidung` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Steinzeit` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Tape Dich` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Die Letzten Beissen die Hunde` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Lausbubenkante` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Zwerg` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Bergbaron` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Via Ente` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Verlängerung` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Au So Rauh` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Vollmond` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Abendsonne` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Tape Dich Direkt` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Riss (Nr 48)` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Oho` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Sturmtag` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Hin und Her` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Moralist` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Obelix` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Lausbubengrat` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Mist` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Nr 6` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Rheumatic Fever` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 15.6m | `Mödling | Lausbubenwand | Bergführerriss` | (48.080482, 16.272032) | (48.080381, 16.272178) |
| 3.2m | `Mödling | Gumpoldskirchen | Flummi` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Nr 10` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Nr 7` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Prutschurdl` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Andi los mi owa` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Ferdis Thron` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Klettersteigrunde B` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Blaubarschbubi` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Olé` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Dancing Susi` | (48.046025, 16.269679) | (48.046052, 16.269666) |
| 3.2m | `Mödling | Gumpoldskirchen | Flitzer` | (48.046025, 16.269679) | (48.046052, 16.269666) |

The 12 `Mödling \| Matterhörndl` rows are off by **16.3km** — that's not drift, the NEW coordinate points to a different crag entirely. The remaining ~60 rows cluster in the 10–20m band, which reads as GPS refinement (same crag, better fix) rather than a real location change — worth a sanity check but not alarming on its own. The Matterhörndl jump is the one that needs Filip's eyes.

### 2.6 Value changes on matched rows (other columns)

Checked grade, grade_band, grade_system, discipline, source, workflow_status, verification_status, name, crag for non-empty BASELINE value → different non-empty NEW value, across all 632 matched rows.

**Zero real content changes.** The only field that shows a diff is `verification_status`, on all 632 rows, and it's a formatting change, not a content change: BASELINE stores `imported-unverified` (kebab-case), NEW stores `Imported - unverified` (title case with spaces/dash). Same meaning, different string — worth normalizing before this becomes the canonical value going forward, but not a data-integrity problem.

### 2.7 ID integrity

All 2,314 rows carry a `Route ID`. Recomputing `uuid5(NAMESPACE_URL, "vertical-moment:" + row_key)` for each row's own `Row Key`:

- **Matched rows (632): 0 mismatches.** Every route that joined cleanly to BASELINE also carries a correctly recipe-derived ID in NEW.
- **Added rows (1,682): all 1,682 mismatch.** Every single "new" row's `Route ID` value is *not* the recipe applied to its own `Row Key`. This isn't a rename (renames still follow the recipe, just for a different key) — these IDs look like they were minted some other way (tested several row_key variants — different casing, `Adlitzgräben` vs `Adlitzgraeben`, no `vertical-moment:` prefix — none of them produced the actual stored ID for a sampled row). Whatever generated the `Route ID` column for the new rows, it wasn't this recipe.

**This is lower-stakes than it looks**: `database/scripts/build_api.py` line 222 always recomputes `rec["id"] = route_id(key)` from `row_key` at build time — it never reads an ID from the source file. So a rebuild would silently overwrite these 1,682 IDs with correct ones and nothing downstream breaks. But it means the `Route ID` column in the spreadsheet itself can't be trusted as a reference right now, and if any tooling outside `build_api.py` reads it directly, that would be wrong.

### 2.8 Internal consistency of NEW

- **Duplicate row_keys**: 0.
- **Duplicate Route ID values** (same ID reused across different rows): 0.
- **Rows missing a Route Name**: 0.
- **Coordinates outside the ~46–49°N / 13–17°E Austria box**: 30. All of them are in regions that didn't exist in BASELINE at all — Wilder Kaiser, Berchtesgaden, Gesäuse i Haller Mauern — which are real places in Tyrol/Bavaria/Styria, just outside the brief's Vienna-area bounding box. Their coordinates look geographically plausible for where they claim to be. One exception is worth a direct look: `Wienerwald i okolice | Großer Illing | Südwest Kante` at (47.624, 11.264) — that longitude is near Innsbruck, ~500km from the Wienerwald the region name implies. Either the region label or the coordinate is wrong on that row.
- **Grades not matching a standard UIAA/French pattern**: 32. Most of these are legitimate combined-grade notation (`6+ (6)`, `3+ (3+)` — overall/crux format used in Austrian topos) that a simple regex doesn't recognize; a few are genuinely irregular and worth a look: `'1-2'` (range, no system), `'B'` (a via ferrata/Klettersteig grade, not a climbing grade), `'ca 9+'` (approximate marker), and two entries with a `'... trav'` suffix (traverse annotation mixed into the grade field).

Full lists (bad coordinates, non-standard grades): see `consistency_detail.json` alongside this report.

## Step 3 — Stop

No merge, no regeneration, no rebuild, no commit. This report and its two companion files (`added_rows_full.txt`, `dropped_rows_full.txt`, `consistency_detail.json`) are the full record. Waiting on Filip's call.
