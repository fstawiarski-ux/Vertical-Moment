# Vertical Moment website

Standard Next.js contributor-platform beta with a phone-first region → crag → route drill-down, search, map, contribution workspace, field-report flow, and the Jammerwandl flagship presentation.

## Local checks

```bash
npm install
npm run dev
npm run build
```

The production build is the required pre-push website check.

## Data layers

- `app/data/routes.json`: existing 632-route website snapshot.
- `database/generated/routes_v1.json`: generated 2,416-route canonical export.
- `app/data/review-routes.json`: separate 188-route guidebook reconciliation overlay.
- `/review-preview`: filterable source-evidence and reconciliation review page.

The reconciliation overlay does not modify the existing website route snapshot or the canonical master workbook. Its source review was approved on 2026-08-01, but canonical import and publication remain separate approval gates.

## Current limitations

- Authentication remains a stub; email magic-link accounts are planned.
- Contribution drafts remain in local storage.
- D1 and R2 helpers are present but not wired to production services.
- Static JSON snapshots do not regenerate automatically yet.

## Cloudflare

The current deployment path is OpenNext for Cloudflare Workers:

```bash
npm run preview
npm run deploy
```

`preview` and `deploy` run an OpenNext build first. Cloudflare publication is intentionally separate from a GitHub push and requires explicit cutover approval.
