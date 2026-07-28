# Jammerwandl route overlays

This folder holds the interactive route-selection layer for the textured wall.

- `route-overlay-manifest-v1.json` is the 37-route source register, stable IDs and unique RGB ID-mask colours.
- `jammerwandl-topo-number-selector-mask-v1.svg` maps the numbered base-row entries in the curated topo. It is a selector mask only, not a route-line trace.
- The Blender template creates one editable curve per route. Trace, snap and verify those curves before adding a web 3D route overlay.

The current viewer must only use a 3D path after the corresponding route entry has `surface_trace_status: traced-provisional` or a stronger verified status.
