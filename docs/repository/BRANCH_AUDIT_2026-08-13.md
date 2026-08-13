# Branch audit and Phase 2 result - 2026-08-13

Repository: `fstawiarski-ux/Vertical-Moment`

## Final result

- `main` at `2eb49f4` is the canonical integration and current production source.
- GitHub reported no open pull requests before or after cleanup.
- PRs #1-#35 remain available as repository history.
- Thirty remote branch pointers whose tips exactly matched their merged PR head commits were deleted on 2026-08-13.
- `agent/explore-capabilities-2026-08-12` remains the active PWA/EXP-02 branch at `5fb71fe`.
- `agent/jammerwandl-source-glb` remains at `8f4b894` because it advanced by three valuable commits after PR #6 merged.
- The repository now has three remote branches: `main` plus those two preserved work branches.

## Recovery checkpoints

| Tag | Commit | Purpose |
|---|---|---|
| `checkpoint/two-product-contract-2026-08-13` | `2eb49f402eeb6497042e3dccffd59513ae551efc` | Canonical two-product contract after PR #35 |
| `checkpoint/pwa-capabilities-2026-08-12` | `5fb71fe0249d51f8759273c5e2e903fe3c59cf72` | Active PWA capability and EXP-02 base |
| `checkpoint/jammerwandl-route-mask-workflow-2026-08-13` | `8f4b894953041b61d8c371b3f054551f4eec8195` | Unmerged Jammerwandl viewer, overlay and Blender-mask workflow |

## Preserved unmerged work

`agent/jammerwandl-source-glb` no longer matched the head commit recorded for merged PR #6. Its later commits are:

| Commit | Purpose |
|---|---|
| `aec2f7c` | Build Jammerwandl viewer pilot |
| `72981c5` | Prepare Jammerwandl route-mask workflow |
| `8f4b894` | Add Jammerwandl Blender route-mask template |

Together they add the route-overlay manifest/build scripts, OSM geometry reference, viewer pilot, sector metadata update and Blender template. This work must be reviewed on its own branch before integration; it was not treated as merged clutter.

## Deleted exact merged PR heads

| PR | Deleted branch |
|---:|---|
| 31 | `fix/offline-packs-and-deep-link-precache` |
| 30 | `fix/precache-revisions-v7` |
| 29 | `agent/lounge-shell-update-2` |
| 28 | `agent/explore-lab-scrub-journey` |
| 27 | `chore/model-viewer-setup` |
| 26 | `feature/nasenwand-panorama-header-stage-rail` |
| 25 | `feature/nasenwand-layout-orbit-scrub-review` |
| 24 | `agent/nasenwand-flagship-live-ui` |
| 23 | `feature/nasenwand-flagship-live` |
| 22 | `agent/static-logos-new-hero` |
| 21 | `agent/finalize-theme-logo` |
| 20 | `agent/homepage-collage-and-nav-fixes` |
| 19 | `agent/explore-climbers-lounge-atlas` |
| 18 | `fix/explore-worker-data-bundle` |
| 17 | `fix/week1-launch-polish` |
| 16 | `agent/panorama-gallery` |
| 15 | `agent/vision-wall-reveal` |
| 14 | `feature/3d-lab-and-layers` |
| 13 | `agent/nasenwand-concepts` |
| 12 | `feature/photography-home-themes` |
| 11 | `chore/archive-platform-routes` |
| 10 | `launch/photography-home` |
| 9 | `ci/auto-deploy-on-merge` |
| 8 | `agent/wachau-master-dataset-update` |
| 7 | `agent/jammerwandl-website-staged-2026-07-31` |
| 5 | `agent/helenental-pilot-draft` |
| 4 | `agent/add-brand-and-master-v3` |
| 3 | `agent/add-small-file-intake` |
| 2 | `agent/import-master-v1` |
| 1 | `agent/initial-collective-scaffold` |

PR #6 is intentionally absent from this deletion table because its source branch contains the later unmerged work recorded above. PRs #32-#35 had already removed their source branches through their merge workflows.

## Verification performed

1. Each deleted branch mapped to exactly one merged PR.
2. Each deleted remote tip exactly matched that PR's recorded `headRefOid`.
3. No open PR existed during deletion.
4. `main` and both preserved branches were verified after deletion.
5. GitHub PR records for deleted heads remained readable after deletion.
6. The repository product contract passed on updated `main`.

Deleting a branch removed only its remote pointer. Its merged PR, head commit record and squash-merge commit remain available on GitHub.
