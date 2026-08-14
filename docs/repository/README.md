# Repository map and operating model

This is the front door for Vertical Moment repository work. Use it when the product, source of truth, deployment target, or responsible role is unclear.

## 1. Choose one scope

Declare the scope before editing:

| Scope | Owns | Branch prefix |
|---|---|---|
| `public-site` | Photography, public pages, SEO, prints and business funnel | `site/` |
| `climbers-lounge-pwa` | Explore app, offline behavior, atlas, panoramas, topo and field beta | `pwa/` |
| `shared-data` | Canonical route data, generated API exports, shared media contracts | `shared/` |
| `repository-operations` | CI, GitHub settings, documentation, recovery and release process | `ops/` |

If a change crosses scopes, call it out in the PR and use a focused shared or operations branch.

## 2. Source of truth

There is one public data flow. Do not hand-edit generated mirrors:

```text
database/master/vertical-moment-canonical.json
        |  approved generator / sync-data
        v
database/api/v1/
        |  verify-data
        v
website/public/data/v1/
        |  Next.js/OpenNext runtime
        v
Cloudflare Workers -> https://verticalmoment.com
```

Rules:

- `database/master/vertical-moment-canonical.json` is the active canonical route source.
- `database/api/v1/` is generated and reviewable; it is not an independent source.
- `website/public/data/v1/` is a deploy mirror and must remain byte-identical to `database/api/v1/`.
- Notion, workbooks, OCR, field notes and review bundles are evidence or staging until explicitly reconciled into canonical JSON.
- Unverified GPX, raw scans, route evidence and heavy masters stay outside the public runtime.

## 3. Product and deployment map

| Surface | Status | Rule |
|---|---|---|
| `website/` | Transitional combined Next.js/OpenNext runtime | The only deployable web runtime in this repository. |
| `https://verticalmoment.com` | Canonical production | Cloudflare Workers is the production deploy target. |
| `/explore` | Unlisted catalog experience | `noindex`; keep links intentional. |
| `/explore-app` | Private-by-link PWA beta | Direct link remains available with `noindex`; no public navigation or authentication boundary. |
| `/review-preview` | Local development review tool | Production returns 404. |
| GitHub Pages | Retired | Do not add content or use its old URL as a preview. |

## 4. Branch and review path

1. Start from current `origin/main` in a clean checkout.
2. Create a short-lived `site/`, `pwa/`, `shared/`, or `ops/` branch.
3. Change only the named scope and preserve unrelated work.
4. Run the relevant local checks and inspect the staged file list.
5. Open a pull request; `main` is protected and direct pushes are not the normal path.
6. Merge only after required checks pass and the appropriate reviewer has approved.
7. Cloudflare deployment is automatic after merge, but live smoke testing is a separate release step.

## 5. Where to go next

- Roles and permissions: [`ROLES.md`](ROLES.md)
- Release and rollback: [`../operations/RELEASE_RUNBOOK.md`](../operations/RELEASE_RUNBOOK.md)
- Software stack: [`../operations/SOFTWARE_STACK.md`](../operations/SOFTWARE_STACK.md)
- Product boundaries: [`../PRODUCT_MAP.md`](../PRODUCT_MAP.md)
- Canonical recovery state: [`../recovery/CANONICAL_STATE.md`](../recovery/CANONICAL_STATE.md)
- Cleanup safety: [`CLEANUP_RUNBOOK.md`](CLEANUP_RUNBOOK.md)

## 6. Five-minute orientation

```powershell
Set-Location "D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment-public-v5"
git status --short --branch
git log -1 --oneline
Get-Content .github\CODEOWNERS
Set-Location website
npm ci
npm test
npm run verify-data
```

If the checkout is dirty, stop and identify its owner before running cleanup or staging commands.
