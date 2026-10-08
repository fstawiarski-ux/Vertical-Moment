# Hut build, update and release
8 October 2026. Reviewed research release 2026-10-08-r3. Manual merge handoff; see MANUAL_MERGE_2026-10-08.md. No push, merge or deployment performed.

## Canonical inputs
database/huts/master/expanded-master-data.json contains reviewed research.
database/huts/master/active-routes.json contains only the active routes from the extracted project's work/research/master-data.json.
database/huts/master/release.json contains the research version and source/workbook/offline-guide checksums.

Never repopulate the live library from the older non-route arrays in master-data.json. Keep the original list number and string directory ID unchanged. Preserve evidence IDs, contexts, qualifiers and dates. Public data must contain no personal notes or test accounts.

## Refresh from the master
The extracted master's work/refresh_all.py uses the active host spreadsheet skill and supported ArtifactTool authoring/export to refresh all fifteen tabs, HTML, coverage and validation. It also calls work/export_hut_web.py to produce a reviewed web-source bundle. The seven-tab legacy builder must never overwrite the expanded workbook.

To transfer an approved reviewed release into this repository:
```powershell
rtk proxy <supported-python> <master-project>/work/export_hut_web.py --repository <website-repository>
```

This copies the current reviewed research, extracts only active routes and records checksums, then runs sync-huts. Keep personal account data and Excel/guide personal copies separate. Review changes before replacing an already published release.

Approach reference IDs currently depend on the reviewed route content. If route content is changed, compare existing personal approach references and plan a migration/reconfirmation before publication; do not silently drop saved trips. Current route input is unchanged. No GPS track is inferred from these route references.

## Build and local verification
Use the pinned lockfile and Node 24. Run from website/. This host requires rtk-prefixed shell commands. Project .npmrc records the lockfile's legacy-peer-deps setting, so plain npm ci is supported.
```powershell
rtk proxy npm ci
rtk proxy npm run sync-huts
rtk proxy npm run verify-huts
rtk proxy npm test
rtk proxy npm run verify-data
rtk proxy npm run verify-canonical
rtk proxy npm run verify-pwa-content
rtk proxy npm run verify-security
rtk proxy npm audit
rtk proxy npm run build:cloudflare
```

The supported local combination is Next 16.3.8, OpenNext Cloudflare 1.20.9 and Serwist 9.5.13. All predev/prebuild variants synchronize both existing climbing data and huts. Generated public/huts-data/v1 JSON and public/sw.js are ignored and must be regenerated, not manually edited or included in source patches. Generated lib/huts metadata is derived from the same canonical inputs.

verify-huts compares all exported records, visitors, surroundings, tariffs, events, dates, routes and context rows and checks each evidence reference. The manifest binds the Excel/HTML hashes to the web release. verify-data/verify-canonical check the existing climbing data mirror.

## Local account preview
Copy .dev.vars.example to an ignored .dev.vars. Generate a fresh random account secret of at least 32 characters; never commit it or place it in a report. Set BETTER_AUTH_URL=http://localhost:3026.
```powershell
rtk proxy npm run hut-db:local
rtk proxy npm run hut-types
rtk proxy npm run build:cloudflare
rtk proxy npm run preview:huts:local -- --log-level warn
```

preview:huts:local explicitly uses the localhost upstream so production custom-domain rewriting does not corrupt Origin-sensitive auth. It is local-only, with local D1 persistence. Do not use a tunnel or remote bindings. Stop the preview before rebuilding on Windows because the runtime locks .open-next files.

The review package's tests/hut-web-journeys.mjs creates a fresh synthetic localhost account and a ignored fixture file under work/. The offline and legacy-sync journeys use that fixture. Keep the fixture, .dev.vars, .wrangler, browser storage and local databases out of Git and all archives. The bundle excludes actual test credentials.

Local URLs:
- http://localhost:3026/huts
- http://localhost:3026/explore-app/planner/list
- http://localhost:3026/explore-app/planner/trips
- http://localhost:3026/explore-app/planner/today
- http://localhost:3026/explore-app/planner

A localhost preview is accessible on this computer only. It is not live on the public domain or available on the phone's separate network address.

## Owner-managed publication after review
The root AGENTS.md requires: “Prepare a focused local diff and validate it. Stop for user review before commit/push/PR unless the user separately authorizes publication. Production and Cloudflare verification are distinct from repository review.”

The original user also prohibited publication/deployment without an explicit request. No push, pull request, merge, deployment, external message or scheduled monitor has been performed. A local commit/bundle is prepared for the owner's manual merge. Two empty remote D1 databases were created during setup before the owner stopped it; their exact state is recorded in MANUAL_MERGE_2026-10-08.md. The temporary Wrangler sign-in was then disconnected.

The owner now performs the pull, review, merge and deployment manually. The following are future owner setup steps:
1. Review/apply the focused source change against the recorded base HEAD; keep the existing production rollback version.
2. Provision the intended production D1 database and replace the HUT_DB placeholder. Review the storage/account region, backup and retention choices with the owner.
3. Store BETTER_AUTH_SECRET using Cloudflare's secret mechanism; keep BETTER_AUTH_URL at the production HTTPS origin. Do not copy the local preview secret.
4. Apply the hut migrations to the approved remote database, not to the climbing database. Record the database ID and migration results without secrets.
5. Configure/test email verification and password recovery before general account registration. The delivered source disables public/HTTPS sign-up and requires email verification there; synthetic sign-up works only in an HTTP loopback preview. Review the privacy notice and account-data/export/recovery process.
6. Run the configuration guard, build and repository checks; review all diff files. deploy/upload run the guard automatically and currently fail on the placeholder ID.
7. Verify the HTTPS preview: secure cookies, account isolation, CSRF, shares/revocation, mobile install/update/offline, source notices and the existing climbing planner. Local success does not stand in for this test.
8. Publish only the approved release, then record its public URL/version and HTTPS verification. Roll back the website if a material runtime issue appears; do not delete private account records as part of rollback.

The deprecated Next middleware filename and Windows OpenNext compatibility warning remain nonblocking in the tested local build. A separate maintenance change can address them; they do not justify a homepage or product migration here.
