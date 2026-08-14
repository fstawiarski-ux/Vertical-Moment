# Contributing

## 1. Select the product

Read `AGENTS.md`, `docs/PRODUCT_MAP.md`, and [`docs/repository/README.md`](docs/repository/README.md) before opening files.

- Public photography/business website: branch from `main` as `site/<task>`.
- Climbers Lounge / Explore PWA: branch from the approved PWA base as `pwa/<task>`.
- Shared data/infrastructure: use `shared/<task>` only when both-product impact is explicit.

Do not use old merged PR branches as new work bases.

## 2. Preserve the starting state

Record repository path, branch, HEAD, upstream and `git status --short`. If the checkout contains unrelated work, create an isolated worktree. Never reset or clean someone else's changes.

## 3. Keep changes focused

- Do not redesign the other product as side work.
- Explain package, Cloudflare, OpenNext, Serwist, workflow or shared-media changes before expanding scope.
- Never manually edit generated `website/public/sw.js`.
- Keep large masters external or in reviewed Git LFS paths; do not add caches or raw reconstruction projects.

## 4. Data-first workflow

1. Create an issue for a new area, sector, route batch, correction or asset import.
2. Preserve the source reference in the relevant record or area manifest.
3. Use stable IDs in lowercase kebab case, for example `vm-at-hoellental-example-sector-001`.
4. Mark uncertain facts as `provisional`; never fill gaps with guesses.
5. Keep extracted/reconciliation work separate from canonical data until approval.
6. Run schema validation and relevant product tests before a pull request.

Never commit personal location details, credentials, copyrighted scans without permission, or media you do not have the right to distribute.

## 5. Review and publication

Provide exact changed files, test/build results and browser/device evidence. Stop for review before push/PR unless publication was separately authorized. Do not merge automatically. Cloudflare deployment and live verification are separate approval gates.

## 6. Repository roles and release path

The role boundaries, CODEOWNERS expectations, required checks, and escalation path live in [`docs/repository/ROLES.md`](docs/repository/ROLES.md). The canonical deployment and rollback procedure lives in [`docs/operations/RELEASE_RUNBOOK.md`](docs/operations/RELEASE_RUNBOOK.md). Do not use the retired GitHub Pages URL as a production preview or source of truth.
