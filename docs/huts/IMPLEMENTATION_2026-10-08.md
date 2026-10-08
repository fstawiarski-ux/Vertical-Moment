# Personal hut library and planner implementation

The integration adds the reviewed 630-hut research to the existing Vertical Moment PWA. It preserves original list numbers, string directory IDs, active route references, field/source check dates and historical qualifiers.

## Routes

| Route | Purpose |
| --- | --- |
| /huts | Filtered library and saved huts |
| /huts/<id> | Reviewed history, operation, approaches, visitor information, tariffs, source evidence and a local documentary plan |
| /huts/sources | Searchable reviewed evidence |
| /explore-app/planner/list | Local photography life list |
| /explore-app/planner/trips | Local hut trips, approach selection and itinerary |
| /explore-app/planner/today | Field-day checklist, published timing and day notes |
| /explore-app/planner | Existing climbing planner with its trip-rendering fix and browser-only persistence |

The account page, authentication handlers, personal workspace API and server-created sharing routes are removed.

## Data flow

Reviewed master JSON and active routes feed sync-huts. It generates the public research index, details and manifest, plus metadata used to validate local planning values. verify-huts reconciles every exported reviewed record and source relationship.

WorkspaceProvider manages local state and browser persistence through device-workspace.ts. It performs no personal-data fetch or HTTP save. It restores prior device copies without requiring a sign-in, preserves original copies, validates edits and reports storage failures.

Import/export and printing remain available. No account database, authentication library, account secret, registration form, mail delivery, verification or recovery setup is used. The embedded climbing planner's account bridge is also removed; its existing local entries and trip checklist behavior remain.

## Unlisted tool behavior

Hut pages use noindex/nofollow and are absent from the public sitemap. The known hut planner pages join the existing PWA preview classification, while existing private-development route exclusions remain intact. Public photography navigation is preserved.

Giving a close friend the address lets that friend use a separate local workspace. Personal notes are not in the URL or server-rendered research. Unlisted access is not an identity-based gate.

## Offline use

The existing bounded root service worker remains. Hut research is cached separately by release. Save for offline stores the chosen hut page and reviewed JSON on the device. Personal edits remain in local browser storage; there is no server queue.

The original worksheet, offline HTML guide, web workspace and climbing planner are independent personal copies. Transfers happen through explicit exports/imports.

## Review

Read PERSONAL_TOOL_VALIDATION_2026-10-08.md for current commands and observed results. This local revision is prepared for owner review before any commit, push or PR creation.
