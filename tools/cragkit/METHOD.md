# Area intake method — Vertical Moment

How any new waypoint GPX becomes a documented area. One command, same output shape
every time, so the guidebook generator, the Blender scene and the topo tracer all read
the same files regardless of which crag they came from.

## Run it

```bash
python cragkit.py Wachau.gpx --name "Wachau" --out ./areas/wachau
python cragkit.py HoheWand.gpx --name "Hohe Wand" --out ./areas/hohewand --dem hw_dem.tif
python cragkit.py Moedling.gpx --name "Mödling" --out ./areas/moedling \
    --dates 2026-04-15,2026-10-01 --start "Parkplatz" --cluster-threshold 150
```

Requires `numpy`, `scipy`. Only `--dem` additionally needs `rasterio` and `pyproj`.

| Flag | Default | When to change it |
|--|--|--|
| `--dem` | none | Whenever you have lidar for the area — see below |
| `--dates` | 4 solstice/equinox dates | Set to the dates you actually shoot or climb |
| `--cluster-threshold` | 250 m | Lower it for compact areas, raise for strung-out valleys |
| `--start` | first sector | Name of the parking or approach-top sector |

## What comes out

| File | Role |
|--|--|
| `master.json` | **Canonical.** Everything else in the pipeline reads this. Sector IDs, local ENU metres, aspect, mesh filenames, empty `routes` array |
| `sectors.csv` | Working spreadsheet — has `scan_status`, `routes_documented`, `notes` columns to fill in |
| `sectors.geojson` | Drop into QGIS |
| `terrain.csv` | Aspect, slope, horizon, and which of those came from a DEM vs. an estimate |
| `sun_shade.csv` / `.md` | Per-sector lit window per date |
| `walking_route.csv` / `.md` | Optimised ground order with leg distances, bearings, Δelevation, cumulative time |

Sector IDs are `AAA-C-NN` — area prefix, cluster, rank by elevation within the area.
They are stable as long as the GPX is, which makes them safe to print.

## The DEM question

Without a DEM, aspect is estimated by fitting a plane through each sector's six nearest
neighbours and taking the downhill direction. For a crag that is usually right, because
rock generally faces the way the ground falls away. But it is an estimate, and the sun
table then only answers *is the sun on this bearing* — not *is this wall actually lit*,
which at 08:00 in a north-facing gully is a different question entirely. Every row
carries a `terrain_source` field so an estimate never quietly passes for surveyed data.

With `--dem` you get a real 3×3 slope/aspect stencil plus a 36-bin horizon profile ray-cast
out to 8 km, and the sun table accounts for the opposite valley side blocking the sun.
For Austria the free lidar DEMs are on data.gv.at / geoland.at — clip to the area in QGIS
and export a GeoTIFF first. This is the single biggest quality jump available, and it costs
one download per area.

## Method notes

- **Solar position** is the NOAA low-precision algorithm, validated against Vienna summer
  solstice (65.24° computed vs 65.2° expected) and equinox sunrise azimuth (90.3° vs 90°).
  Local time uses the EU summer-time rule, so CET/CEST switches automatically by date.
- **Grazing cutoff** is 85° off the wall normal. A wall is "lit" while the sun is within
  that arc and above the horizon. Interruptions — sun blocked mid-day by a ridge — are
  reported separately rather than being averaged away.
- **Walking time** uses Tobler's hiking function, so uphill legs cost more than downhill
  ones and the route order is optimised on time, not distance. Nearest-neighbour seed
  then 2-opt.
- **Deduplication** matches on name *and* position within 3 m, so a genuine repeat name
  at two different places (a ridge tagged at both ends) survives as two sectors.

## Adding an area to the guidebook

1. Run `cragkit.py`, eyeball `terrain.csv` for obviously wrong aspects.
2. Fill grades and route counts into `sectors.csv` in the field.
3. Point the chapter generator at `master.json` — sector tables, IDs and the sun column
   populate themselves; only prose stays hand-written.
4. Anything unverified stays as a `[DO UZUPEŁNIENIA]` marker until it has been on the
   ground. Never let a generated estimate print as a fact.

## Degradation rules (added after the Bad Fischau intake)

Not every GPX carries the same information. The output schema never changes — columns,
files and JSON keys are identical for every area — but fields go empty and a flag records
why, so a downstream reader can always tell measured from estimated from absent.

| Situation | Detected as | Effect |
|--|--|--|
| `<ele>` present | `elevation_source: gpx` | Aspect estimated, sun-on-wall computed, Tobler walking times |
| `<ele>` absent or all identical | `elevation_source: missing` | Aspect/slope blank (`terrain_source: unavailable_no_elevation`), sun table falls back to open-sky daylight (`basis: open_sky_no_aspect`), route times ignore gradient |
| `--dem` supplied | `elevation_source: dem` | Elevations backfilled, real slope/aspect/horizon, `basis: dem_aspect_and_horizon` |

### Area type

Extent under 2 km is a **crag** — cluster threshold 250 m, walking route.
Extent of 2 km or more is a **region** — cluster threshold 3 km, driving route with
straight-line distances multiplied by 1.4 at 45 km/h. That is a planning estimate, not
road routing, and is labelled as such in every output.

Both are recorded in `master.json` as `area_type` and `route_summary.basis`, and both
override cleanly with `--cluster-threshold` and `--travel`.

### Chapter generator

`make_chapter.js` reads those flags and adapts its own wording: the sun column becomes
"Dzień", the elevation column prints em-dashes, and the caveat paragraph switches to the
honest version explaining that neither aspect nor wall sunlight could be computed. The
document cannot claim more precision than the source data supports.


## Same-name waypoints (added after the Helenental intake)

Helenental tagged several crags twice. Merging on exact position was too strict and
merging on name alone would have destroyed real data, so the rule is now three-way:

- **under 25 m apart with the same name** — one rock tagged twice, merged silently
- **25–300 m apart with the same name** — reported in `duplicates_to_review` and printed
  as a REVIEW line; never merged automatically
- **over 300 m apart** — treated as two genuinely different places

Helenental flagged *Kleines Verdon* (246 m) and *Badener Kletterschule* (85 m); Wachau
flagged *Don-Bosco-Grat* (55 m). Those are judgement calls for a human, not the script.
Override the merge distance with `--dedupe-m`.

Note also that a waypoint can appear in two different area files — *Badener Turm* is in
both `bad_fishau.gpx` and `Helental.gpx` at identical coordinates. Nothing detects that
across files; it needs deciding once and fixing in the source GPX.

## Area type is decided on spacing, not extent

The first version classified on bounding-box extent, which put Helenental (3.2 km wide,
but 97 m median spacing) into the driving bucket alongside Bad Fischau (2.5 km median
spacing). Extent measures how far the outliers reach; median nearest-neighbour spacing
measures whether the sectors are actually linked. The rule is now median spacing under
400 m = crag, walking route; above = region, driving. Cluster threshold follows from the
same number: 4 x median spacing, clamped to 250–3000 m.

| Area | Median spacing | Type | Threshold | Groups |
|--|--|--|--|--|
| Wachau | 26 m | crag | 250 m | 3 |
| Helenental | 97 m | crag | 387 m | 4 |
| Bad Fischau | 2503 m | region | 3000 m | 4 |

## History sections

`make_chapter.js` reads three optional config keys: `access_warning` (printed in bold
terracotta directly under the title), `history` (an array of `{title, body, todo}`
rendered as its own chapter after the sector tables), and `sources` (a list closing the
chapter). All three are per-area prose, so they live in the config rather than the
generator, and any area can have them or not.

Rule for history text: local tradition gets labelled as local tradition. The Helenental
chapter says outright that the Ode-to-Joy story is a tourist-office claim rather than a
musicological finding, and every date carries a source. A guidebook that repeats
promotional copy as fact loses the reader's trust on the parts that matter — grades,
bolting, access.


## Travel mode is decided per leg (added after the Peilstein/Rodaun intake)

The first version picked one mode for the whole area. Peilstein/Rodaun broke it: 331 m
median spacing classified it as a crag, so the route came out as a **310-minute walk**
covering an 11 km gap between the northern belt and the southern crags. Nobody walks that.

Each leg is now costed independently: under 1200 m it is walked (Tobler, with gradient
when elevation exists), beyond that it is driven (straight line x1.4 at 45 km/h). Totals
are reported split, and `walking_route.csv` carries a `mode` column per leg. Ascent is
summed over walking legs only. Override with `--travel walking|driving`; `--travel auto`
is the default.

| Area | Total | On foot | Driving |
|--|--|--|--|
| Wachau | 71.2 min | 71.2 | 0 |
| Helenental | 33.3 min | 17.1 | 16.1 |
| Peilstein/Rodaun | 76.2 min | 10.8 | 65.3 |
| Bad Fischau | 73.3 min | 0 | 73.3 |

## Aspect estimation now refuses when it cannot work

Peilstein/Rodaun has elevations, so the plane-fit ran and returned an aspect for every
sector — and almost every one came out N or NNW. That was not the rock. With sectors
~900 m apart, the plane fitted through the neighbours describes the regional tilt of the
Wienerwald, not the wall in front of you. The numbers looked authoritative and were
worthless, which is the worst possible failure mode for a guidebook.

Aspect is now only estimated where at least **three neighbours lie within 150 m**
(`--aspect-radius`). Otherwise the sector gets `terrain_source:
unreliable_sectors_too_far_apart`, aspect and slope stay empty, and the sun table drops
to open-sky daylight. `terrain.csv` records the actual radius used per sector.

Effect: Wachau keeps estimates for 35 of 38 sectors (the three suppressed are exactly the
isolated towers). Peilstein/Rodaun is suppressed entirely — correctly, since no amount of
arithmetic recovers wall aspect from waypoints a kilometre apart. This is the third
independent argument for the DEM.

## Check the filename against the contents

`Peilstein_Rodaun.gpx` contains no Peilstein. The Peilstein massif is a 716 m limestone
peak in Altenmarkt/Weissenbach with west-facing walls up to 100 m and 800+ routes; the
file's 18 points sit at 291-630 m in the belt between Sulz/Sparbach and Rodaun. The
chapter says so at the top rather than quietly filing the points under a wrong heading.
Worth a glance at every new file: filename is a claim, not evidence.

