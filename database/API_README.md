# Vertical Moment — API dataset (v1)

Canonical, versioned, API-shaped climbing data. Generated — **never edit `api/v1/` by hand.**

```
python scripts/build_api.py
```

## Layout

| Endpoint | Contents |
|---|---|
| `api/v1/index.json` | manifest — schema version, stats, every endpoint with byte size |
| `api/v1/routes.json` | every route, full records |
| `api/v1/crags.json` | crag index (name, region, counts, centroid, grade span) |
| `api/v1/regions.json` | region index |
| `api/v1/regions/<slug>.json` | one region: its crags **and** routes |
| `api/v1/crags/<region>/<crag>.json` | one crag: its routes |
| `api/v1/facets.json` | filter vocabularies |
| `api/v1/stats.json` | counts, coverage, provenance |

The website loads `regions/<slug>.json` or `crags/<region>/<crag>.json` — never
`routes.json`, which exists for bulk consumers and future API sync.

## Identity

```
row_key  = "Area | Wall | Route"
route_id = uuid5(NAMESPACE_URL, "vertical-moment:" + row_key)
```

Deterministic and reproducible: the same route always gets the same UUID, on any
machine, forever. Verified against all 632 IDs in the v3.0 master workbook.
Crag and region IDs use the same recipe with `crag:` / `region:` prefixes.

**Never assign an ID by hand.** Rename a crag and the slug changes but the ID
does not, so existing deep links keep resolving. Every record carries both its
`id` and its `row_key`, so it can be traced back to any source.

## Sources

Merged by `row_key`. Later sources fill gaps and override non-null fields;
`provenance` on each record lists which sources contributed.

| Source | File | Required |
|---|---|---|
| canonical | `master/vertical-moment-canonical.json` | yes |
| notion | `sources/notion-export.csv` | review only; not auto-merged |

The workbook at `master/vertical_moment_master_routes_v1.xlsx` is retained as
an import/review baseline. It is not an active input when the canonical JSON
exists.

### Reviewing a Notion change

Notion is a review workbench; it is not an automatic publication source. To
propose a change:

1. Export the **Guidebook Routes** database as a CSV for evidence.
2. Review the proposed rows and provenance in a draft PR.
3. Apply only the approved change to `master/vertical-moment-canonical.json`.
4. Run `python scripts/build_api.py`, `npm run sync-data`, and `npm run verify-data`.
5. Commit the canonical and generated API diff together.

This keeps the canonical JSON, generated API, website mirror, and client atlas
on one publication path with no silent source conflict.

## Adding a source

Write a `load_*()` returning dicts that each carry a `row_key`, append it to
`SOURCES` in `build_api.py`, re-run. Merge order is source order. No other file
changes.

## Adding a field

Add the column to the master workbook, map it in `load_master()`, re-run. New
fields appear in the output; consumers that don't know about them ignore them.
Removing or renaming a field is a breaking change — cut `api/v2/` instead and
leave v1 in place until the website has moved.

## Licence

Route data CC-BY-SA. Crag geometry © OpenStreetMap contributors (ODbL) — the
attribution must stay visible wherever crag positions are displayed.
