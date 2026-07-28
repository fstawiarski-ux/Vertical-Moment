# Vertical Moment – place crag meshes at true relative positions
# Reads wachau_master.json; imports <slug>.obj from MESH_DIR if present,
# otherwise drops an empty as a placeholder. Z is set from GPX elevation
# minus the lowest sector so the scene sits near the origin.
import bpy, json, os

MASTER = "/path/to/wachau_master.json"
MESH_DIR = "/path/to/meshes"

d = json.load(open(MASTER, encoding="utf-8"))
z0 = min(s["enu"][2] for s in d["sectors"])

for s in d["sectors"]:
    x, y, z = s["enu"][0], s["enu"][1], s["enu"][2] - z0
    path = os.path.join(MESH_DIR, s["mesh_file"])
    if os.path.exists(path):
        before = set(bpy.data.objects)
        bpy.ops.wm.obj_import(filepath=path)
        for ob in set(bpy.data.objects) - before:
            ob.location = (x, y, z)
            ob.name = s["slug"]
    else:
        e = bpy.data.objects.new(s["slug"], None)
        e.empty_display_type = "PLAIN_AXES"
        e.empty_display_size = 5
        e.location = (x, y, z)
        bpy.context.collection.objects.link(e)

    txt = bpy.data.curves.new(s["slug"] + "_lbl", type="FONT")
    txt.body = s["name"]
    txt.size = 6
    ob = bpy.data.objects.new(s["slug"] + "_lbl", txt)
    ob.location = (x, y, z + 12)
    bpy.context.collection.objects.link(ob)

print("placed", len(d["sectors"]), "sectors")
