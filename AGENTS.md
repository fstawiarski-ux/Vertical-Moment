# Vertical Moment agent contract

This repository contains two product streams. Before editing, declare exactly one scope:

- `public-site`
- `climbers-lounge-pwa`
- `shared-data`
- `repository-operations`

Read `README.md`, `docs/PRODUCT_MAP.md` and the selected product README under `products/`.

## Required preflight

Before any write, report and verify:

1. repository path;
2. active branch;
3. exact HEAD;
4. upstream branch;
5. working-tree status;
6. selected product scope.

Never discard, overwrite, reset, clean or move existing work merely because it belongs to another product. Use an isolated worktree when the active checkout contains unrelated changes.

## Branch policy

- `main` is canonical and protected.
- Use `site/<task>` for public-site work.
- Use `pwa/<task>` for Climbers Lounge/PWA work.
- Use `shared/<task>` only when the task explicitly requires cross-product foundations.
- Do not create permanent product branches as substitutes for directory ownership.
- Do not push, merge, deploy, delete branches or rewrite history without explicit approval.

## Product boundaries

Public-site work must not change PWA routes, layout state, route search, offline behavior, service-worker behavior, climbing data, topo, panoramas or 3D tools unless shared scope is explicitly approved.

PWA work must not redesign the public photography homepage, gallery, business/contact funnel, public SEO or public navigation unless shared scope is explicitly approved.

Shared infrastructure includes package manifests/lockfiles, root Next layout and CSS, OpenNext, Cloudflare/Wrangler, Serwist, GitHub Actions, data synchronization and shared media. Explain the compatibility requirement before modifying any of it.

## Data and assets

- Never invent climbing regions, crags, sectors, routes, grades, access facts or geometry.
- Preserve authoritative, provisional and unverified status.
- `website/public/sw.js` is generated. Never edit it manually or include it in a source patch.
- Keep multi-GB scans, raw photo sets, caches and reconstruction projects outside Git. Commit reviewed manifests, checksums and optimized derivatives.
- Do not overwrite canonical workbooks, brand masters or source media.

## AI/model rules

- Rediscover available models and providers; do not hard-code a remembered free tier.
- Do not send complete Atlas JSON, large media, private source archives or secrets to a model.
- Use one writer at a time. Review agents do not silently modify the writer's output.
- Every completion claim must cite inspected files, exact commands and observed results.

## Review gates

Prepare a focused local diff and validate it. Stop for user review before commit/push/PR unless the user separately authorizes publication. Production and Cloudflare verification are distinct from repository review.
