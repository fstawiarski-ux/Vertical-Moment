# Branch audit - 2026-08-13

Repository: `fstawiarski-ux/Vertical-Moment`

## Result

- `main` at `da6630c` is the canonical integration and current production source.
- GitHub reported no open pull requests after PR #34 merged.
- PRs #1-#34 were merged into `main`.
- PR #32, PR #33 and PR #34 source branches were already removed through their merge workflows.
- Thirty-one older merged-PR heads remain remotely and are cleanup candidates after preservation/review.
- `agent/explore-capabilities-2026-08-12` has no merged PR and is the active PWA capability branch. Keep it until EXP-02 and later capability work are resolved.
- Squash-merged branches can appear "not merged" to Git ancestry checks. GitHub's merged PR record is the deciding evidence for the historical heads below.

## Keep

| Branch | Reason |
|---|---|
| `main` | Canonical integration and current production deployment source |
| `agent/explore-capabilities-2026-08-12` | Active PWA capability/EXP review work |
| `review/two-product-cleanup-2026-08-13` | Temporary review branch; remove after its approved PR is merged |

Future work should use short-lived `site/`, `pwa/` or approved `shared/` branches.

## Merged PR heads still present and eligible for deletion after review

| PR | Historical branch | Product/role |
|---:|---|---|
| 31 | `fix/offline-packs-and-deep-link-precache` | PWA offline/deep-link fix |
| 30 | `fix/precache-revisions-v7` | PWA precache fix |
| 29 | `agent/lounge-shell-update-2` | PWA shell/search/deep links |
| 28 | `agent/explore-lab-scrub-journey` | PWA scrub/responsive workspace |
| 27 | `chore/model-viewer-setup` | PWA foundation/model viewer |
| 26 | `feature/nasenwand-panorama-header-stage-rail` | PWA Nasenwand/panorama |
| 25 | `feature/nasenwand-layout-orbit-scrub-review` | PWA Nasenwand layout |
| 24 | `agent/nasenwand-flagship-live-ui` | PWA Nasenwand live UI |
| 23 | `feature/nasenwand-flagship-live` | PWA Nasenwand explorer |
| 22 | `agent/static-logos-new-hero` | Public site/brand |
| 21 | `agent/finalize-theme-logo` | Public site/brand |
| 20 | `agent/homepage-collage-and-nav-fixes` | Public site homepage |
| 19 | `agent/explore-climbers-lounge-atlas` | PWA Atlas |
| 18 | `fix/explore-worker-data-bundle` | Shared Cloudflare/PWA data fix |
| 17 | `fix/week1-launch-polish` | Public/PWA integration history |
| 16 | `agent/panorama-gallery` | PWA panorama |
| 15 | `agent/vision-wall-reveal` | PWA spatial concept |
| 14 | `feature/3d-lab-and-layers` | PWA/spatial and shared brand assets |
| 13 | `agent/nasenwand-concepts` | PWA Nasenwand concepts |
| 12 | `feature/photography-home-themes` | Public site photography |
| 11 | `chore/archive-platform-routes` | Shared route/archive policy |
| 10 | `launch/photography-home` | Public site launch |
| 9 | `ci/auto-deploy-on-merge` | Shared deployment workflow |
| 8 | `agent/wachau-master-dataset-update` | Shared canonical data |
| 7 | `agent/jammerwandl-website-staged-2026-07-31` | Shared initial website/data release |
| 6 | `agent/jammerwandl-source-glb` | 3D source assets |
| 5 | `agent/helenental-pilot-draft` | Shared route data |
| 4 | `agent/add-brand-and-master-v3` | Shared brand/data archive |
| 3 | `agent/add-small-file-intake` | Shared workbench |
| 2 | `agent/import-master-v1` | Canonical data baseline |
| 1 | `agent/initial-collective-scaffold` | Repository foundation |

## Deletion gate

Do not delete any branch until:

1. this audit is reviewed;
2. canonical checkpoint tags are approved and created;
3. the PR URL and merged commit remain available;
4. no open PR or unreviewed work points to the branch;
5. remote tips are re-fetched immediately before deletion;
6. the owner approves the explicit branch list.

Deletion removes branch pointers, not merged PR history. It is still a remote destructive action and therefore remains a separate approval step.
