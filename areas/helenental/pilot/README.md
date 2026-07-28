# Höllental four-wall pilot

## Purpose

Establish one repeatable path from source material to a reviewable digital
topo, 3D wall asset and route data. This pilot is intentionally local and
uncommitted while the source package is assembled.

## Scope

| Sector | Master V1 routes | Model state | Location state |
|---|---:|---|---|
| Beethovenwand | 24 | OBJ/MTL candidate located | GPX point available |
| Engelstein | 18 | MeshLab project candidate located | GPX point available |
| Siegenfelder Steinbruch | 13 | OBJ/MTL + texture candidate located | exact sector point needed |
| Jammerwandl | 37 | OBJ/MTL candidate located | GPX point available |

The 92-route pilot total and the 359-route wider Höllental catalogue are
derived Master V1 counts, not final claims of on-rock route status.

## Method

1. Put only the supplied source files in the matching `intake/` directory.
2. Record every source and uncertainty in the sector manifest.
3. Repair/package the selected 3D asset into a portable model package
   (model, material, texture, source project and manifest).
4. Match the Master V1 route inventory against the supplied topo. Do not
   silently rename, delete or create routes.
5. Draw a provisional rope topo on the original wall image/model. Mark every
   unconfirmed line `provisional`.
6. Field-check starts, finishes, anchors, access and restrictions.
7. Review the change set together; only then prepare a commit and pull request.

## Release gates

No route, topo, coordinate or 3D asset is promoted to the canonical database
until its source is attached and its verification state is explicit. No pull
request is created without user approval after the review step.
