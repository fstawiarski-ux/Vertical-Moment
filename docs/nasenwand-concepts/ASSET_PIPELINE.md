# Nasenwand asset-preparation pipeline

## Source/master layer

Keep these outside the website repository:

- original DNG/JPG photography;
- RealityScan/RealityCapture project files;
- 8192 × 8192 texture atlases;
- multi-hundred-megabyte GLB/PLY files;
- multi-gigabyte OBJ meshes;
- Blender working files and backups.

The inspected Nasenwand sources include a 4000 × 3000 drone JPG, a 4000 × 3000 topo reference, 729–930 MB source GLBs, and larger OBJ/PLY exports. None of those model masters belong in a Worker bundle or Git history.

## Website derivative layer

The included tool creates:

- 1280 px and 2400 px photo WebP;
- 1280 px and 2400 px spatial-relief WebP;
- 1280 px and 2400 px topo WebP;
- 1280 px and 2400 px transparent route-reference PNG;
- `asset-manifest.json` with source dimensions and SHA-256 checksums.

Run from `Vertical-Moment/website/`:

```powershell
node tools\nasenwand\prepare-assets.mjs `
  --photo "D:\path\to\DJI_0026.JPG" `
  --topo "D:\path\to\nasentopomask.png" `
  --prefix "nasenwand" `
  --out "public\photography\nasenwand"
```

The script reads source files and writes derivatives; it never edits the inputs.

`sharp` is already present in the inspected Next.js installation. If a future clean installation cannot resolve it, add it explicitly in the feature branch:

```powershell
npm.cmd install --save-dev sharp@0.35.3
```

Review the resulting package diff before committing.

## Route extraction

The route PNG is extracted from the supplied topo image by selecting strong blue line pixels, removing small isolated pixels, recoloring the surviving route reference to the site accent, and preserving transparency. This is a visual reference, not a verified route geometry export.

Do not convert the extracted pixels into route facts, grades, lengths, or navigation guidance.

## Real 3D upgrade pipeline

1. Duplicate the master model into a web-prep workspace.
2. Crop to the wall/sector needed by the camera; remove distant terrain and scan noise.
3. Decimate with silhouette/route-contact review, not only a target triangle count.
4. Rebuild normals and validate face orientation.
5. Bake a 2K or 4K texture set; use KTX2/Basis for production delivery.
6. Apply Draco or Meshopt compression and remove unused animations/materials.
7. Validate scale, bounds, origin, camera presets, and route-object naming.
8. Generate a poster image and a no-WebGL fallback.
9. Store the optimized model in Cloudflare R2 with a versioned immutable key.
10. Load it only after user intent or when the Lab chapter approaches the viewport.
11. Preserve the original project, texture, and mesh as master-only material.

## Approval boundary

Before publishing a route overlay or a 3D camera match, review:

- photo/model camera registration;
- route-to-wall registration;
- route name/grade/length provenance;
- whether the overlay is safe to show publicly;
- whether every provisional label remains visible.
