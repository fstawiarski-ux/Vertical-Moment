"""Create a Jammerwandl Blender template for 37 editable 3D route traces.

Run after installing Blender:
  blender --background --python scripts/blender_prepare_jammerwandl_routes.py -- --repo "D:/.../Vertical Moment"

The script imports the textured RealityScan OBJ, creates one hidden editable
curve object for each canonical topo number, and saves a .blend template.
It does not fabricate route paths; trace the curves against the curated topo
and snap/shrinkwrap them to the mesh before export.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy


def get_repo() -> Path:
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if "--repo" in args:
        return Path(args[args.index("--repo") + 1]).resolve()
    return Path(__file__).resolve().parents[1]


def ensure_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def import_obj(path: Path) -> None:
    if hasattr(bpy.ops.wm, "obj_import"):
        bpy.ops.wm.obj_import(filepath=str(path))
    else:
        bpy.ops.import_scene.obj(filepath=str(path))


def new_route_curve(route: dict, collection: bpy.types.Collection) -> bpy.types.Object:
    curve = bpy.data.curves.new(route["model_overlay"]["curve_object"], type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    spline = curve.splines.new("POLY")
    spline.points.add(1)
    for point in spline.points:
        point.co = (0.0, 0.0, -1000.0, 1.0)
    obj = bpy.data.objects.new(curve.name, curve)
    collection.objects.link(obj)
    obj.hide_render = True
    obj.hide_viewport = True
    obj["vm_route_id"] = route["route_id"]
    obj["vm_topo_number"] = route["topo_number"]
    obj["vm_source_grade"] = route["source_grade"]
    obj["vm_id_mask_colour"] = route["id_mask_colour"]
    obj["vm_trace_status"] = "untraced"
    return obj


def main() -> None:
    repo = get_repo()
    manifest_path = repo / "areas/helenental/sectors/jammerwandl/route-overlays/route-overlay-manifest-v1.json"
    obj_path = repo / "models/source/helenental/jammerwandl/realityscan/obj-export/jammegooooood.obj"
    output = repo / "models/work/helenental/jammerwandl/blender/jammerwandl-route-mask-template.blend"
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)

    import_obj(obj_path)
    wall_collection = ensure_collection("VM_JAMMERWANDL_WALL")
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH":
            for old in list(obj.users_collection):
                old.objects.unlink(obj)
            wall_collection.objects.link(obj)
            obj.name = "vm_jammerwandl_textured_wall"
            obj["vm_asset_role"] = "textured-source-mesh"

    route_collection = ensure_collection("VM_JAMMERWANDL_ROUTE_TRACES")
    for route in manifest["routes"]:
        new_route_curve(route, route_collection)

    scene = bpy.context.scene
    scene["vm_project"] = "Jammerwandl route mask template"
    scene["vm_manifest"] = str(manifest_path)
    scene["vm_workflow"] = "Unhide one route curve, trace/snap it to the mesh, then set vm_trace_status to traced-provisional."
    bpy.ops.wm.save_as_mainfile(filepath=str(output))
    print(f"Saved {output}")


if __name__ == "__main__":
    main()
