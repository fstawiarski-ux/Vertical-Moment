"""Build the provisional Jammerwandl route-overlay manifest and 2D selector mask.

The curated rope topo already shows the visual route lines. This script creates
one unique ID-mask colour and one clickable number-anchor selector per route.
It deliberately does not invent full route geometry: that is traced onto the
textured mesh later in Blender.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SOURCE_REGISTER = REPO / "areas/helenental/sectors/jammerwandl/topo/workbench/jammerwand-route-register-source-v1.md"
OUTPUT_DIR = REPO / "areas/helenental/sectors/jammerwandl/route-overlays"
MANIFEST = OUTPUT_DIR / "route-overlay-manifest-v1.json"
SELECTOR_MASK = OUTPUT_DIR / "jammerwandl-topo-number-selector-mask-v1.svg"
TOPO = "../topo/workbench/jammerwand-original-rope-topo-with-register-v1.png"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def parse_register() -> list[dict[str, str | int]]:
    routes = []
    for line in SOURCE_REGISTER.read_text(encoding="utf-8").splitlines():
        match = re.match(r"\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|", line)
        if not match:
            continue
        number, name, grade = match.groups()
        routes.append({"number": int(number), "name": name, "grade": grade})
    if len(routes) != 37:
        raise ValueError(f"Expected 37 routes in source register, found {len(routes)}")
    return routes


def id_colour(number: int) -> str:
    """Lossless RGB ID, excluding black (reserved for no route)."""
    return f"#{(number >> 16) & 255:02x}{(number >> 8) & 255:02x}{number & 255:02x}"


def display_colour(number: int) -> str:
    return ("#36d7e7", "#ff6c58", "#f6c451")[(number - 1) % 3]


def selector_anchor(number: int) -> dict[str, float]:
    # Anchors follow the numbered base row in the curated 1536 × 1524 topo.
    x = 68 + (number - 1) * (1395 / 36)
    return {"x": round(x, 2), "y": 846.0, "radius": 19.0}


def build_manifest(routes: list[dict[str, str | int]]) -> dict:
    entries = []
    for route in routes:
        number = int(route["number"])
        name = str(route["name"])
        route_id = f"vm-hel-jammerwandl-{number:03d}-{slugify(name)}"
        entries.append({
            "route_id": route_id,
            "topo_number": number,
            "route_name": name,
            "source_grade": route["grade"],
            "canonical_match_status": "awaiting-master-v1-key-reconciliation",
            "display_colour": display_colour(number),
            "id_mask_colour": id_colour(number),
            "topo_selector": {"type": "route-number-anchor", "status": "provisional", **selector_anchor(number)},
            "model_overlay": {
                "curve_object": f"vm_route_{number:03d}_{slugify(name)}",
                "uv_mask_colour": id_colour(number),
                "surface_trace_status": "untraced",
                "field_verification_status": "unverified"
            }
        })
    return {
        "id": "vm-hel-jammerwandl-route-overlays-v1",
        "status": "provisional-2d-selectors-ready-3d-traces-pending",
        "topo_source": TOPO,
        "topo_dimensions": {"width": 1536, "height": 1524},
        "id_mask_rule": "RGB #000001 through #000025 map to topo routes 1 through 37; #000000 means no route.",
        "important": "2D selector anchors locate each numbered topo entry only. They are not route-line geometry and must not be rendered as 3D route paths.",
        "routes": entries
    }


def build_selector_svg(routes: list[dict[str, str | int]]) -> str:
    circles = []
    for route in routes:
        number = int(route["number"])
        anchor = selector_anchor(number)
        circles.append(
            f'  <circle id="route-{number:03d}" data-route-number="{number}" '
            f'cx="{anchor["x"]}" cy="{anchor["y"]}" r="{anchor["radius"]}" fill="{id_colour(number)}"/>'
        )
    return "\n".join([
        '<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1524" viewBox="0 0 1536 1524">',
        '  <title>Jammerwandl route-number selector mask v1</title>',
        '  <desc>Lossless ID mask for the numbered entries in the curated rope topo. This is a selector mask, not route-line geometry.</desc>',
        *circles,
        '</svg>',
        ''
    ])


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    routes = parse_register()
    MANIFEST.write_text(json.dumps(build_manifest(routes), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    SELECTOR_MASK.write_text(build_selector_svg(routes), encoding="utf-8")
    print(f"Wrote {MANIFEST.relative_to(REPO)} and {SELECTOR_MASK.relative_to(REPO)}")


if __name__ == "__main__":
    main()
