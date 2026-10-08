# Personal hut planner — integration validation

8 October 2026. Final account-free personal-tool version. Earlier account/synchronization validation files and integration ZIPs are superseded by this handoff.

Repository: https://github.com/fstawiarski-ux/Vertical-Moment

Scope: shared-data. Repository approval policy and the owner's explicit instructions require review before commit, push or PR creation. This handoff is prepared locally; none of those publication actions has occurred.

The original checkout remains on shared/hut-planner-2026-10-08 at 2b5db3f135fff4727d74f1a90788f4ef46a91668, with origin/main at db4e56fee38253e7a4d2ff082fb6ef6977524e58. The final prepared diff uses a separate temporary Git index. The owner's real index remains untouched.

## Result

PASS for the checks below. Validation used an isolated local checkout with a clean dependency install and the built Cloudflare Worker at http://localhost:3036. No hut .dev.vars, database migration, email service or account runtime secret was used. Synthetic plans were created in temporary browser contexts, never in the source data.

| Exact command / action | Observed result |
| --- | --- |
| rtk proxy npm ci --offline --no-audit --no-fund | Exit 0; 517 packages installed from the pinned lockfile. Remaining dependency versions unchanged; 23 authentication-related lock entries removed. |
| rtk proxy npm run hut-types | Exit 0; generated environment declares existing IMAGES, ASSETS and WORKER_SELF_REFERENCE only. |
| rtk proxy <node> node_modules/vitest/vitest.mjs run --cache=false | Exit 0; 137 tests in 18 files passed, including local workspace callbacks, old local-copy recovery, quota/corrupt-copy preservation, research checksums and unlisted-route classification. |
| rtk proxy <node> node_modules/typescript/bin/tsc --noEmit --incremental false | Exit 0 with .open-next/worker.js temporarily held outside the isolated checkout; confirms type checking does not require a prebuilt Worker. Original Worker restored afterwards. |
| rtk proxy npm run verify-data | Exit 0; 357 canonical climbing API files and website mirror byte-identical. |
| rtk proxy npm run verify-canonical | Exit 0; 2,390 routes, 330 crags and 20 regions agree. |
| rtk proxy npm run verify-pwa-content | Exit 0; 5 boxes, 29 assets, 9 pilot manifests, 81 asset slots, 16 private preview adapters, 2 regional manifests and 7 nodes verified. |
| rtk proxy npm run verify-security | Exit 0; no public GPX files/runtime GPX URLs; repository Actions pinned. |
| rtk proxy npm run verify-personal-huts | Exit 0; hut account routes, authentication packages, email/account environment configuration and HUT_DB binding absent. |
| rtk proxy npm run build:cloudflare | Exit 0; production compilation and TypeScript pass; 1,009 static pages; service worker precaches 105 URLs; OpenNext Worker bundle produced. |
| rtk proxy npm run predeploy | Exit 0, starting with generated public/huts-data/v1 absent. Regenerates all hut assets and verifies fidelity/configuration before release. Only preparation was run. |
| rtk proxy npm run preupload | Exit 0, independently starting with generated public/huts-data/v1 absent. Only preparation was run. |
| rtk proxy npm run verify-huts | Exit 0; every exported reviewed record and relationship agrees with canonical inputs. |
| rtk proxy <bundled-node> work/personal-tool-browser.mjs | Exit 0; all 11 browser journeys pass; zero page errors and zero account/workspace/server-sharing API requests. |

The browser check uses headless Chrome at 1280×900 and 390×844 against the actual built local Worker. Phone content fits the viewport without horizontal overflow. Review screenshots contain synthetic test entries.

## Browser journeys

1. Open the unlisted 630-hut library without an account; verify noindex header and metadata, and no account/email/password controls.
2. Create an Otto-Haus trip; save and reload itinerary, published approach, day notes and checklist values.
3. Save documentary permission details locally, explicitly download the hut for offline use, and verify normal guide printing excludes documentary notes.
4. Export the actual saved workspace as a deliberate backup.
5. Open the same tool address in a fresh phone browser; verify an empty personal workspace with no owner notes.
6. Import the reviewed backup on the phone; reload and verify restored trip and photo status.
7. Edit after opening an import preview; apply the older backup and retain the newer local day notes.
8. Go offline, edit notes, cold-reload the trip, and open the previously downloaded hut guide with tariff qualifiers.
9. Save and reload a named climbing trip; verify no account sync control and that Copy address contains only the tool address.
10. Verify retired /account, /api/auth/get-session, /api/hut-workspace, /api/hut-shares and /share/... return 404.
11. Verify the sitemap contains no hut entries, no personal API requests occur, and no browser exceptions occur.

## Research preservation and earlier fixes

Research release 2026-10-08-r3 retains 630 original hut identities, 5,158 routes, 3,501 sources, 21,672 evidence references, 947 dates, 1,903 tariffs and 22 events. Original list numbers, string directory IDs, route identities, source dates and historical/current qualifiers remain intact.

- Expanded research checksum, UTF-8 normalized to LF: 78af8ae506a9c1101ce0da6373782e7b6868f0935005e48f7e4c8c1fc5f59a0a.
- Active routes checksum: 545d177b56a5a155adad5b59f47d535d595da1bdeb8ba7e67f8e288583fa3c8c.
- Original workbook byte checksum: fab95204d705439137a3aad81fe1d22aba4b9f55e34da71c69bd36026e5ab17c.
- Original standalone explorer byte checksum: 2821b47e830a4e8c1a0e327e1a9c23115efcef5b759d3c2a942915c913c30dfb.

The exporter was exercised with both CRLF and LF copies: export, generate and fidelity verification passed for each, with the same reviewed checksum. The handoff includes the corrected master exporter separately under master-tools/.

The earlier lost-edit issue is now covered by local workspace tests and the browser import-preview journey. Account conflict resolution itself has been removed along with the account system. Generation before release checks is retained and now succeeds without account deployment configuration.

## Shared runtime

The complete integration carries the improved batch's shared runtime updates: Node 24 in the three existing workflows, pinned Next 16.3.8/OpenNext 1.20.9, related locked build dependencies and Cloudflare compatibility date 2026-10-08. These shared changes are covered by the full build and existing product checks. The personal-tool conversion adds no further version upgrades and preserves the production domain and deployment trigger.

## Final behavior and limits

The owner-selected unlisted/direct-link approach excludes hut routes from indexing and public photography navigation. Someone with the address can open the research and use an independent browser workspace. It is not an identity or password gate.

Bookmarks, documentary plans, trips, checklists and day notes stay in the current browser. The previous local device copy can be recovered without any request. Clearing site data or using another device requires an intentional export/import backup; there is no automatic device synchronization. Exports contain personal notes and must be shared intentionally.

No registration, sign-in/out, email verification/recovery, account database, personal synchronization API or server-generated trip-sharing service remains in the hut tool or its climbing planner bridge. Existing shared contribution schema and its original Drizzle dependency are preserved.

The repository is public. Research and application source will be visible in a PR; personal workspace exports, browser profiles, secrets and synthetic fixture files are excluded. The existing deploy.yml workflow can deploy a qualifying main push after the owner manually merges the PR. Opening the PR itself does not perform that deployment.

This is local repository and Worker validation. Production account/resource state, hosted browser behavior and deployment were not changed or asserted. Existing build-tool deprecation/platform notices did not prevent validation; the personal-tool conversion adds no further version upgrades beyond the supplied integration.

Inspect these implementation files in the prepared source: website/lib/huts/device-workspace.ts; website/components/huts/WorkspaceProvider.tsx; website/components/huts/DataTools.tsx; website/public/explore-app/planner-content.html; website/scripts/verify-personal-huts.mjs; website/scripts/hut-research-integrity.mjs; website/package.json; website/wrangler.jsonc; website/app/huts/layout.tsx; website/app/robots.ts; website/app/sitemap.ts; website/src/core/pwaPreviewAccess.ts.
