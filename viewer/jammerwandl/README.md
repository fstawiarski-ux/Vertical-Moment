# Jammerwandl viewer prototype

An internal, static prototype for the first Höllental digital wall.

It loads the owner-approved Jammerwandl GLB and filters canonical Master V1
route data for `Helenental / Jammerwandl`. Route selection is functional in the
register, but 3D route splines are intentionally not drawn yet: those require
route start/finish alignment against the model or field verification.

## Run locally

From the repository root:

```powershell
python -m http.server 4173
```

Open `http://localhost:4173/viewer/jammerwandl/` in a modern browser.

The prototype imports Three.js from a public CDN, so the browser needs an
internet connection the first time it loads.
