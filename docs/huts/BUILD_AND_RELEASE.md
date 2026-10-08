# Personal hut planner: build and release

8 October 2026. Reviewed research release 2026-10-08-r3.

The hut library and planners are unlisted tools for the owner and close friends who receive the address. They require no registration, sign-in, email provider, account database or hut-specific runtime secret. Personal planning data stays in each browser.

## Canonical inputs

- database/huts/master/expanded-master-data.json: reviewed research.
- database/huts/master/active-routes.json: only the active routes from the master's work/research/master-data.json.
- database/huts/master/release.json: release, identities and source checksums.

The expanded research checksum uses UTF-8 text normalized to LF (expanded_sha256_format: utf8-lf). Windows CRLF and Git/Linux LF copies therefore verify the same reviewed content. Original workbook and offline-guide hashes continue to identify their exact original bytes.

Preserve original list numbers, string hut IDs, evidence references, source check dates, qualifiers and route identities. Personal plans must never become part of the public research JSON.

## Refresh from the research master

The master's work/export_hut_web.py copies reviewed research, extracts active routes, records checksums and runs sync-huts:

    rtk proxy <supported-python> <master-project>/work/export_hut_web.py --repository <repository> --node <supported-node>

The exporter is supplied separately under master-tools/ in the handoff. It belongs in the master project. Do not overwrite the expanded canonical workbook with a legacy builder.

## Build and verify

Run from website/ using Node 24 and the pinned lockfile:

    rtk proxy npm ci
    rtk proxy npm run sync-data
    rtk proxy npm run sync-huts
    rtk proxy npm run verify-huts
    rtk proxy npm run verify-personal-huts
    rtk proxy npm run verify-data
    rtk proxy npm run verify-canonical
    rtk proxy npm run verify-pwa-content
    rtk proxy npm run verify-security
    rtk proxy npm test
    rtk proxy npx tsc --noEmit --incremental false
    rtk proxy npm run build:cloudflare

predeploy and preupload run prepare:huts:release: generate hut assets, verify research, check security boundaries and confirm that account routes/dependencies/database configuration remain absent. No D1 placeholder, account origin, mail setup or migrations are required.

public/huts-data/v1 JSON and public/sw.js are generated and ignored. Never edit them by hand or ship them in source patches. Existing climbing data and the photography website share this runtime, so a full build and their verification checks are required.

## Local preview

    rtk proxy npm run preview:huts:local -- --log-level warn

The built Worker runs at http://localhost:3036. No .dev.vars file or local database is needed for hut planning. Keep the preview local and stop it before rebuilding on Windows.

Useful routes: /huts, /huts/167, /huts/sources, /explore-app/planner/list, /explore-app/planner/trips, /explore-app/planner/today and /explore-app/planner.

## Review and publication

Prepare the local PR diff and description, then obtain the owner's explicit approval before committing, pushing or creating the PR. The owner reviews and merges manually. Opening a PR does not deploy this change.

The repository's existing deploy.yml workflow deploys on qualifying pushes to main. Merging an approved PR can trigger that workflow. No deployment workflow or existing Cloudflare credential is changed by this personal-tool conversion.

Unlisted/noindex is direct-link access, not an access gate. Research pages can be opened by someone with the address. Browser notes are never sent to a server or embedded in shared tool URLs. The GitHub repository is currently public; never commit personal workspace exports, notes, browser profiles, local secrets or test fixtures.

See PRIVATE_PLANS_AND_SHARING.md for saving, backup and close-friend use.
