# Hut library and private photography planner
8 October 2026. Local implementation for review. Reviewed research release: **2026-10-08-r3**. A local commit/bundle is prepared for manual merge. Nothing was pushed, merged, published or deployed. See MANUAL_MERGE_2026-10-08.md for the production setup that was stopped and the exact remaining state.

## Scope and recorded audit
Scope: shared-data, because the existing public Next.js site and climbing PWA share authentication, dependencies, Cloudflare and the service worker. The photography homepage has not been redesigned.

Implementation worktree: shared/hut-planner-2026-10-08, based on origin/main at db4e56fee38253e7a4d2ff082fb6ef6977524e58. The original checkout at D:/VERTICALMOMENT/GITHUB REPOS/Vertical-Moment-public-v5 is untouched. The protected Vertical-Moment reference checkout is untouched.

The live planner and its embedded page were inspected in fresh desktop and phone browser contexts. The initial read-only report is preserved in the master project's outputs/Vertical_Moment_Hut_Planner_Integration_2026-10-08.md. Two concrete problems were observed: Trip planner used checklist before initialization, and account sync depended on unavailable claude.use hooks. The outer Copy link action copied only the generic planner address.

The existing master had already been inspected and updated to fifteen tabs, with the original twelve retained. This website implementation consumes that reviewed release. It adds no new hut facts and does not change the Excel or offline guide bytes.

## Implemented pages

| Address | Result |
|---|---|
| /huts | Public searchable/filterable library of exactly 630 original entries; linkable selections; private bookmarks. |
| /huts/<string-directory-ID> | Stable hut page with original list number, story, Before you go, dated notices, approaches, stay/rules, food/tariffs, routes/mountains, history, events, contacts/sources and My shoot plan. |
| /huts/sources | Searchable source IDs, direct evidence URLs, check dates and evidence use. |
| /explore-app/planner/list | Private photography life list based on saved huts, personal plans and trip destinations. Explicit photo status; no inferred visit. |
| /explore-app/planner/trips | Private named/date-specific hut trips, published approach choice, notes, check reminders, day log, print, import/export and controlled sharing. |
| /explore-app/planner/today | Phone-friendly selected trip, hut notices, approach reference, qualified daylight estimates, checklist and personal log. |
| /account | Email/password sign-in and private account workspace. Account recovery/verification require the release setup described below. |
| /share/<random-token> | Read-only snapshot of fields reviewed by the trip owner. Revocable. |
| /explore-app/planner | Existing eighteen-tab climbing planner, with its trip rendering repaired and real opt-in account sync. |

The existing PWA toolbar, phone More menu and command palette link to the hut library and private trips. The hut header connects the library, life list, trips, climbing planner and account. Legacy #hut=167&section=food links redirect to the same stable hut/section.

## Repair record

| Finding | Implemented repair | Evidence |
|---|---|---|
| Trip planner failed before checklist existed | Moved checklist use after initialization; retained the existing views and state key | Trip, Calendar, Crag index, Sources and Field day browser journeys |
| Unavailable account-sync hooks | Authenticated D1-backed workspace and explicit legacy planner opt-in/merge | Desktop/phone account and legacy-sync journeys |
| Copying planner address implied trip sharing | Clearly named planner-address copy; separate trip preview and read-only link creation | Minimal share and owner-only revocation checks |
| Original guide data could be replaced during migration | Previewed, additive import for existing bookmark/documentary formats; retain conflicting nonempty notes | Original-format import journey and workspace tests |
| Offline account edits could be lost or overwrite another device | User-scoped device copy, queued saves, revision checks, three-way merge and explicit conflict review | Offline conflict and expired-session recovery journeys |
| Private information could enter public caches or prints | Network-only account/API/share responses; public hut print excludes My shoot plan | Cache inventory and print checks |
| Some long source URLs overflowed a phone | Scoped link wrapping and responsive hut layout | 390 px checks on emergency, closure and access examples |
| Populated notes had ambiguous implicit labels | Fixed accessible control names | Returning to saved trips and editing existing values |
| Printed trip notes could be clipped | Full text print spans for itinerary notes and day log | Print media check |
| Narrow PWA registration did not cover hut pages | Root worker; retire old narrow registration after activation; catch offline update failure | Worker migration and original-key preservation journey |
| Dependency and adapter incompatibilities | Patched supported Next 16.3.8/OpenNext 1.20.9, Serwist 9.5.13 and current compatible tools | Full build and actual local workerd runtime; npm audit |
| Local preview rewrote localhost Origin to production domain | Dedicated localhost upstream preview command; strict origin checks retained | Account creation/sign-in and foreign-origin 403 checks |

## Data fidelity
The public export contains 630 unchanged list-number/string-ID pairs, 5,158 published route references, 3,501 sources, 1,903 tariffs, 947 date records, 22 event references and 395 contexts. The verifier compares complete exported records, tariffs, events, dates, routes and contexts to the canonical inputs and resolves 21,672 source references.

Reviewed facts come from database/huts/master/expanded-master-data.json. Active routes come from active-routes.json, exported solely from the current master-data.json.routes. The older research arrays are excluded.

The index is approximately 476 KB. Individual hut details load separately; the fourteen-megabyte detail collection is not downloaded for every normal visit. Selected huts can be saved offline. All source IDs, URLs, evidence uses, check dates, conflicting qualifications and missing-information labels are preserved.

Known closure, winter-room, overnight-parking, emergency-capacity, membership/age/year/unit/inclusion and event-date distinctions remain. Anniversary candidates are not announced events. Source check dates describe the reviewed snapshot, not a live clearance.

## Validation
Exact commands and observed outputs are recorded in website/reports/hut-release-validation.json. Browser reports are copied into website/reports/hut-*.json after final local verification.

Completed checks include the full Next/Serwist/OpenNext build, all 133 tests in 17 files, hut data verification, canonical climbing data/mirror verification, PWA content/pilot checks, security boundary checks and npm audit with zero reported vulnerabilities. Browser journeys use fresh isolated Chrome contexts and synthetic localhost accounts only. User bookmarks, plans, credentials and production data were never loaded into test fixtures.

Local Cloudflare workerd was tested directly, including D1 account storage. A Next development build alone is not treated as Cloudflare runtime validation. HTTPS production cookies, provisioned D1, remote migrations and live operation remain separate checks.

## Recorded research batch and remaining gaps
The reviewed r3 batch remains IDs **679, 513, 736, 569, 120, 610, 53, 167**: the six requested documentary examples, plus Enzian-Hütte am Kieneck and Otto-Haus for Vienna-related history/source gaps. Reasons, official/secondary evidence, URLs, check dates and unresolved conflicts are preserved in the master research-batch file.

Current coverage still has 229 construction/origin gaps, 497 original-opening gaps and 150 hut-specific Wikipedia link gaps. The 144 nonhistorical story introductions explicitly retain their history gap. Hut-specific viewpoint, sky suitability, filming/archive consent and flight permission are personal scouting/review fields, not researched clearances.

## Remaining release work
The owner will pull, review, merge and deploy manually. Public/HTTPS sign-up is disabled until verified account mail and recovery are implemented; no Gmail connection is needed for local review. Two empty EU D1 databases were created before production setup was stopped, with no migrations or data; Wrangler was subsequently logged out. The full state is in the manual handoff.

Provision the production D1 binding and account secret, apply remote migrations only after publication approval, configure and test email verification/password recovery before general public account registration, then test the HTTPS deployment and existing climbing/PWA journeys. A configuration guard currently refuses the placeholder D1 ID.

Hut research is a dated release and needs subsequent official-source batches. It is not a current weather, booking, access or flight-permission feed. Media uploads, collaborative editing, invitation-only sharing, a hut map and translations remain later work.
