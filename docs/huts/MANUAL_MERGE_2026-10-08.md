# Manual merge handoff — 8 October 2026

The owner will pull, review, merge and deploy this work manually. The assistant has stopped production setup. No Gmail password, app password or other mail credential was received or stored. The temporary Gmail SMTP packages were removed. No email was sent.

## What is prepared

The separate public 630-hut library connects to the existing planner through the life list, private trip workspace, field-day view and reviewed read-only trip shares. The existing planner rendering and account-sync integration are repaired. The canonical reviewed data, string IDs, source relationships, Excel and offline HTML remain unchanged from research release 2026-10-08-r3.

Branch: shared/hut-planner-2026-10-08.
Base commit: db4e56fee38253e7a4d2ff082fb6ef6977524e58.
Scope: shared-data.
Repository: work/website-integration in the extracted master project.
A local Git bundle and source patch are provided. Nothing was pushed to GitHub, no pull request was created and nothing was merged or deployed.

The current source permits synthetic unverified accounts only on an HTTP localhost/127.0.0.1/IPv6 loopback preview. Public/HTTPS sign-up is disabled and email verification is required for sign-in there. The account screen explains the guest alternative. General public registration and password recovery still need a chosen, verified account-mail service and implementation. No Gmail connection is required to review or build this work.

CI now uses Node 24 for the application tests, visual QA and deployment build. Project .npmrc records legacy-peer-deps, matching the reviewed lockfile; plain npm ci uses it. The test workflow synchronizes and validates the hut data alongside the existing climbing data.

## Import the prepared branch

Extract the handoff package and keep its .bundle file with the README. Use a clean review checkout of Vertical-Moment that contains the base commit. Verify the current branch/status first and preserve unrelated work.

From that review checkout, replace <bundle-file> with the actual extracted absolute .bundle path:

```powershell
rtk proxy git bundle verify "<bundle-file>"
rtk proxy git fetch "<bundle-file>" shared/hut-planner-2026-10-08
rtk proxy git switch --create shared/hut-planner-review FETCH_HEAD
rtk proxy git diff --stat db4e56fee38253e7a4d2ff082fb6ef6977524e58
rtk proxy git diff --check db4e56fee38253e7a4d2ff082fb6ef6977524e58
```

Choose a different unused review branch name if that one already exists. Fetching the bundle does not push to GitHub or change production. The source patch is an alternative; do not apply it on top of the fetched branch a second time.

Review and run the local checks before manually merging. The source patch excludes generated public/sw.js, public/huts-data/v1, dependencies, local D1 data, .dev.vars and browser/account fixtures. Rebuild generated assets with the documented tools. A bundle imports an existing local commit; its base commit is a prerequisite, not a second full copy of the repository history.

## Local checks and preview

Use Node 24 from website/:

```powershell
rtk proxy npm ci
rtk proxy npm run sync-data
rtk proxy npm run sync-huts
rtk proxy npm run verify-huts
rtk proxy npm run verify-data
rtk proxy npm run verify-canonical
rtk proxy npm run verify-pwa-content
rtk proxy npm run verify-security
rtk proxy npm test
rtk proxy npm run build:cloudflare
```

For local accounts, use the ignored .dev.vars described in BUILD_AND_RELEASE.md, a fresh random local secret and BETTER_AUTH_URL=http://localhost:3026. The local migration and preview commands explicitly use --local. Nothing in the bundle contains the existing test secret or synthetic account fixture.

## Production setup is left to the owner

The existing deploy.yml automatically deploys when website/database changes are pushed to main. A local merge alone does not deploy. Review this before pushing the merge.

Wrangler still contains the local HUT_DB placeholder and the predeploy configuration guard deliberately rejects it. Do not remove the guard simply to make deployment green. Select the intended database/binding, store a fresh production auth secret through the hosting provider, apply migrations to that hut database, and verify the HTTPS account/runtime before enabling private account services. Existing FIELD_OPS_ACCESS_KEY must be preserved; never replace it with a hut test secret.

Public research and guest plans do not need an email sender. General account registration remains disabled in the delivered source until verified mail and password recovery are implemented and tested. The account secret is an application secret, separate from any personal email password. Configure any future mail provider in your hosting secret store; do not send credentials through chat or commit them.

## Cloudflare state already changed before the owner stopped setup

Two new empty D1 databases were created in the owner's Cloudflare account, with EU jurisdiction and an EEUR primary location:

| Database | ID | State |
|---|---|---|
| vertical-moment-hut-planner | a151bbcb-5251-4932-891c-5eabf52429c1 | Created only; no remote migrations or records added; not bound to production |
| vertical-moment-hut-planner-preview | 7f13f624-4805-457a-a430-418186a35dfb | Created only; no remote migrations or records added; no preview Worker deployed |

The databases were not deleted. You can retain them for your manual setup or remove them in Cloudflare if unused. No production secret, email binding, DNS record or sender configuration was created. The website routes and Worker were not changed. Last inspected live Worker version: 7dd49f9f-8602-4405-acbd-c0e81eb6e8dc, created 3 October 2026.

Wrangler logout completed successfully after setup was stopped. No further Cloudflare configuration is performed by this handoff.

## Validation and limits

See website/reports/hut-manual-merge-validation.json and the packaged validation report for the final observed commands, build and browser checks. The earlier reports document the preceding local review; the final handoff supersedes their uncommitted-state wording. No production HTTPS or GitHub CI pass is claimed.

Research coverage remains explicit: 229 construction/origin gaps, 497 original-opening gaps and 150 hut-specific Wikipedia gaps. The recorded research batch remains IDs 679, 513, 736, 569, 120, 610, 53 and 167. Dates, closures, winter rooms, parking restrictions, tariff conditions, evidence uses and event qualifications remain traceable. Viewpoints, visits, expenses and permissions belong to personal planning, and no drone clearance is inferred.
