# Release and rollback runbook

Use this runbook for any change that can reach `verticalmoment.com`.

## Production truth

Cloudflare Workers at `https://verticalmoment.com` is the only production deployment. The old GitHub Pages site is retired and must not be used for review, fallback or content publication.

## Before opening a PR

From the canonical checkout:

```powershell
git fetch origin main
git status --short --branch
git diff --check
```

For website or shared-data work:

```powershell
Set-Location website
npm ci
npm run verify-data
npm test
npx tsc --noEmit -p tsconfig.json
npm run build:next
```

For Explore/PWA work also run `npm run build` and `npm run build:sw`. Add browser/device evidence when interaction or responsive behavior changes.

## Pull request gate

The PR must identify scope, changed files, data authority, privacy impact, validation, and rollback. Required GitHub checks are:

- `test`
- `validate-json`
- `contract` when repository or product-contract paths change

Do not merge a PR with unresolved review comments, stale data mirrors, public private assets, or a failing build.

## Merge and deploy

1. Merge the approved PR into `main`.
2. Wait for the Cloudflare deployment workflow to complete successfully.
3. Confirm the deployed commit is the merged `main` commit.
4. Smoke-test `/`, `/climbers-lounge`, `/explore-app`, `/review-preview`, `/robots.txt`, `/sitemap.xml`, and one representative panorama route. `/start` must land on `/climbers-lounge`.
5. Confirm private surfaces remain private: `/explore-app` must be direct-link/noindex only, with no public navigation or sensitive content; `/review-preview` may remain 404; GPX assets should not resolve.
6. Record the commit, workflow URL, live checks and any residual issue in the handoff or release note.

## Rollback

The normal rollback is a reviewed revert PR against `main`. Do not force-push or reset `main`.

1. Identify the bad merged commit and affected surface.
2. Revert it in a new branch.
3. Run the same checks and open a PR marked `rollback`.
4. Merge after checks pass; Cloudflare will deploy the revert.
5. Re-run the live smoke checks and record the result.

If a secret or private asset was exposed, remove the asset, rotate the credential or revoke the URL through the owning provider before treating the code rollback as complete.

## Evidence record

At minimum record:

- merged commit;
- PR URL;
- required check results;
- Cloudflare workflow URL;
- live URL/status checks;
- data-sync result;
- rollback commit if used.
