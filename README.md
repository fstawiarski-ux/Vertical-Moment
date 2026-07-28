# Vertical Moment Collective

The source repository for Vertical Moment Collective: structured climbing data, guidebook evidence, 3D wall assets, and the software that presents them.

## Start here

1. Read [the data policy](docs/DATA_POLICY.md) and [contributing guide](CONTRIBUTING.md).
2. Add authoritative route records under `database/json/routes/` using `database/schemas/route.schema.json`.
3. Store a sector's source references and media manifest beside its area folder in `areas/`.
4. Keep large meshes, textures and video in Git LFS or external storage; commit manifests and metadata here.

## Repository map

- `database/` — canonical structured records and export-ready schemas
- `areas/` — area and sector context, source references and manifests
- `models/` — 3D asset manifests and production conventions
- `viewer/`, `website/`, `app/` — product workspaces
- `guidebook/`, `media/`, `ai/` — publishing and intelligence inputs
- `docs/`, `infrastructure/`, `scripts/`, `tests/` — operating documentation and tooling
- `workbench/` — small, versioned working sources that have not yet become canonical project data
- `tools/` — reusable import and generation utilities

This repository deliberately separates source evidence from interpreted data. Do not publish unverified route, safety, access or land-use information as final.
