#!/usr/bin/env python3
"""
Vertical Moment — API dataset builder (v1)

Merges every route source into one canonical, versioned, API-shaped tree.

  INPUTS  (database/)
    master/vertical_moment_master_routes_v1.xlsx   sheet "Routes"   (required)
    sources/notion-export.csv                      Notion CSV export (optional)
    sources/crags.geojson                          OSM crag features (optional)

  OUTPUT  (database/api/v1/)
    index.json            manifest: version, counts, every endpoint
    routes.json           every route, full records
    regions.json          region index
    crags.json            crag index
    regions/<slug>.json   one region: its crags + routes
    crags/<slug>.json     one crag: its routes
    stats.json  facets.json

  IDs are deterministic:
      route_id = uuid5(NAMESPACE_URL, "vertical-moment:" + row_key)
      row_key  = "Area | Wall | Route"
  Re-running always yields the same IDs. Never assign one by hand.

  Adding a source later: write a load_*() that returns records with a
  row_key, append it to SOURCES, re-run. Merge is by row_key, last
  source wins per field, and nothing else changes.

  usage:  python build_api.py [--out DIR]
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = "1.0.0"
ID_NAMESPACE = "vertical-moment:"
HERE = Path(__file__).resolve().parent.parent


def slugify(text: str) -> str:
    if text is None:
        return ""
    s = unicodedata.normalize("NFKD", str(text))
    s = s.replace("ß", "ss")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def route_id(row_key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, ID_NAMESPACE + row_key))


def make_row_key(area: str, wall: str, route: str) -> str:
    return f"{area} | {wall} | {route}"


def clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def as_float(v):
    try:
        f = float(v)
        return f if f == f else None
    except (TypeError, ValueError):
        return None


def load_master(path: Path) -> list[dict]:
    """Master workbook, sheet 'Routes'. The authoritative transcription."""
    import openpyxl

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["Routes"]
    rows = ws.iter_rows(values_only=True)
    hdr = [str(h).strip() if h else "" for h in next(rows)]
    idx = {h: i for i, h in enumerate(hdr)}

    def cell(r, name):
        i = idx.get(name)
        return clean(r[i]) if i is not None and i < len(r) else None

    out = []
    for r in rows:
        name = cell(r, "Route")
        if not name:
            continue
        area = cell(r, "Area") or "Unknown"
        wall = cell(r, "Wall") or area
        out.append({
            "row_key": cell(r, "Row Key") or make_row_key(area, wall, name),
            "name": name,
            "grade": cell(r, "Grade"),
            "grade_band": cell(r, "Grade band"),
            "grade_system": cell(r, "Grade system"),
            "discipline": (cell(r, "Discipline") or "sport").lower(),
            "region": area,
            "area": area,
            "crag": wall,
            "wall": wall,
            "source": cell(r, "Source"),
            "latitude": as_float(r[idx["Latitude"]]) if "Latitude" in idx else None,
            "longitude": as_float(r[idx["Longitude"]]) if "Longitude" in idx else None,
            "notion_page_id": cell(r, "Notion Page ID"),
            "workflow_status": cell(r, "Status"),
            "provenance": ["master"],
        })
    wb.close()
    return out


NOTION_ALIASES = {
    "route": "name", "name": "name", "grade": "grade",
    "grade band": "grade_band", "grade system": "grade_system",
    "discipline": "discipline", "area": "area", "wall": "wall",
    "source": "source", "row key": "row_key", "id": "notion_page_id",
    "notion page id": "notion_page_id",
}


def load_notion_csv(path: Path) -> list[dict]:
    """Native Notion CSV export of the Guidebook Routes DB.

    Re-export and re-run to resync; nothing is transcribed by hand.
    Routes absent from the master are ADDED, not dropped.
    """
    if not path.exists():
        return []
    out = []
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for raw in csv.DictReader(fh):
            rec = {}
            for k, v in raw.items():
                key = NOTION_ALIASES.get((k or "").strip().lower())
                if key:
                    rec[key] = clean(v)
            name = rec.get("name")
            if not name:
                continue
            area = rec.get("area") or "Unknown"
            wall = rec.get("wall") or area
            rec.update({
                "row_key": rec.get("row_key") or make_row_key(area, wall, name),
                "region": area, "area": area, "crag": wall, "wall": wall,
                "discipline": (rec.get("discipline") or "sport").lower(),
                "provenance": ["notion"],
            })
            out.append(rec)
    return out


SOURCES = [
    ("master", lambda d: load_master(d / "master" / "vertical_moment_master_routes_v1.xlsx")),
    ("notion", lambda d: load_notion_csv(d / "sources" / "notion-export.csv")),
]


def merge(batches: list[tuple[str, list[dict]]]) -> list[dict]:
    """Merge every source by row_key. Later sources fill gaps and override
    non-null fields; provenance records which sources touched each record."""
    merged: dict[str, dict] = {}
    for label, records in batches:
        for rec in records:
            key = rec["row_key"]
            if key not in merged:
                merged[key] = dict(rec)
                continue
            tgt = merged[key]
            for k, v in rec.items():
                if k == "provenance":
                    continue
                if v is not None:
                    tgt[k] = v
            if label not in tgt["provenance"]:
                tgt["provenance"].append(label)

    out = []
    for key, rec in merged.items():
        rec["id"] = route_id(key)
        rec["region_slug"] = slugify(rec["region"])
        rec["crag_slug"] = slugify(rec["crag"])
        rec["slug"] = slugify(rec["name"])
        rec["path"] = f"/crags/{rec['region_slug']}/{rec['crag_slug']}#{rec['id']}"
        rec["has_coords"] = rec.get("latitude") is not None
        rec.setdefault("verification_status", "imported-unverified")
        out.append(rec)
    out.sort(key=lambda r: (r["region"], r["crag"], r["name"]))
    return out


def write_json(path: Path, payload) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=False)
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def build_crags(routes: list[dict]) -> list[dict]:
    byc: dict[tuple, list] = defaultdict(list)
    for r in routes:
        byc[(r["region"], r["crag"])].append(r)
    crags = []
    for (region, crag), rs in sorted(byc.items()):
        lats = [r["latitude"] for r in rs if r.get("latitude") is not None]
        lons = [r["longitude"] for r in rs if r.get("longitude") is not None]
        crags.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, ID_NAMESPACE + f"crag:{region} | {crag}")),
            "name": crag,
            "slug": slugify(crag),
            "region": region,
            "region_slug": slugify(region),
            "route_count": len(rs),
            "latitude": round(sum(lats) / len(lats), 6) if lats else None,
            "longitude": round(sum(lons) / len(lons), 6) if lons else None,
            "grades": sorted({r["grade"] for r in rs if r.get("grade")}),
            "disciplines": sorted({r["discipline"] for r in rs if r.get("discipline")}),
            "path": f"/crags/{slugify(region)}/{slugify(crag)}",
        })
    return crags


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "api" / "v1"))
    args = ap.parse_args()
    out = Path(args.out)

    batches = []
    for label, loader in SOURCES:
        try:
            recs = loader(HERE)
        except FileNotFoundError:
            recs = []
        print(f"  source {label:8s} {len(recs):5d} records")
        batches.append((label, recs))

    routes = merge(batches)
    crags = build_crags(routes)
    regions = []
    for name in sorted({r["region"] for r in routes}):
        rs = [r for r in routes if r["region"] == name]
        cs = [c for c in crags if c["region"] == name]
        regions.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, ID_NAMESPACE + f"region:{name}")),
            "name": name, "slug": slugify(name),
            "crag_count": len(cs), "route_count": len(rs),
            "path": f"/crags/{slugify(name)}",
        })

    generated = datetime.now(timezone.utc).isoformat(timespec="seconds")
    meta = {"schema_version": SCHEMA_VERSION, "generated": generated}
    endpoints = {}

    endpoints["routes.json"] = write_json(out / "routes.json", {**meta, "count": len(routes), "routes": routes})
    endpoints["crags.json"] = write_json(out / "crags.json", {**meta, "count": len(crags), "crags": crags})
    endpoints["regions.json"] = write_json(out / "regions.json", {**meta, "count": len(regions), "regions": regions})

    for reg in regions:
        rs = [r for r in routes if r["region_slug"] == reg["slug"]]
        cs = [c for c in crags if c["region_slug"] == reg["slug"]]
        endpoints[f"regions/{reg['slug']}.json"] = write_json(
            out / "regions" / f"{reg['slug']}.json",
            {**meta, "region": reg, "crags": cs, "routes": rs})

    for c in crags:
        rs = [r for r in routes if r["region_slug"] == c["region_slug"]
              and r["crag_slug"] == c["slug"]]
        endpoints[f"crags/{c['region_slug']}/{c['slug']}.json"] = write_json(
            out / "crags" / c["region_slug"] / f"{c['slug']}.json",
            {**meta, "crag": c, "routes": rs})

    facets = {
        "regions": sorted({r["region"] for r in routes}),
        "disciplines": sorted({r["discipline"] for r in routes if r.get("discipline")}),
        "grade_bands": sorted({r["grade_band"] for r in routes if r.get("grade_band")}),
        "sources": sorted({r["source"] for r in routes if r.get("source")}),
    }
    endpoints["facets.json"] = write_json(out / "facets.json", {**meta, **facets})

    stats = {
        "routes": len(routes), "crags": len(crags), "regions": len(regions),
        "with_coords": sum(1 for r in routes if r["has_coords"]),
        "by_provenance": {k: sum(1 for r in routes if k in r["provenance"])
                          for k in ("master", "notion")},
        "by_region": {r["name"]: r["route_count"] for r in regions},
    }
    endpoints["stats.json"] = write_json(out / "stats.json", {**meta, **stats})

    write_json(out / "index.json", {
        **meta,
        "name": "Vertical Moment climbing data",
        "license": "route data CC-BY-SA; crag geometry © OpenStreetMap contributors (ODbL)",
        "id_recipe": 'uuid5(NAMESPACE_URL, "vertical-moment:" + row_key)',
        "stats": stats,
        "endpoints": [{"file": k, "bytes": v} for k, v in sorted(endpoints.items())],
    })

    print(f"\n  {len(routes)} routes / {len(crags)} crags / {len(regions)} regions")
    print(f"  {len(endpoints) + 1} files -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
