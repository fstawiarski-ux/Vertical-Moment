# Private plans and sharing
8 October 2026. Implemented locally; production provisioning remains pending.

## What belongs where
Reviewed hut facts and their sources are generated public assets. Personal bookmarks, twenty documentary fields, named trips, checklists, photo statuses, day logs, expenses written in notes and the original planner state belong to a user workspace. They never enter the reviewed JSON, Excel research columns or public hut assets.

The existing guide's bookmarks and documentary plans remain browser-local. Export/import transfers them explicitly. The website does not read or replace the user's original guide storage. Excel personal cells, offline guide plans and web account plans are separate copies; no automatic Excel account sync is claimed.

## Account storage and boundaries
Better Auth handles email/password authentication using its maintained password hashing and D1/Drizzle adapter. Sessions are stored in the same D1 binding and sent in HttpOnly, SameSite=Lax cookies. HTTPS selects secure cookies. Request handlers create their own resources; no request-bound D1/auth state is stored globally.

The workspace is keyed by the authenticated user ID from the server session. Clients cannot select another owner's ID. Anonymous reads return 401. Writes require the configured exact Origin and JSON; bounded bodies and strict schema checks apply. Hut IDs are strings. An approach must belong to the chosen hut. Revision checks return 409 for stale saves.

Rate limits apply to account actions. SQL uses parameters and owner conditions. Auth, workspace and sharing responses have private/no-store headers and noindex. The public preview restrictions for unrelated private tools remain intact.

Email delivery and password reset are **not implemented in this local release**. Synthetic unverified sign-up works only in an HTTP loopback preview. Public/HTTPS sign-up is disabled and public sign-in requires a verified email. The account screen explains guest planning while registration is unavailable. Configure/test a chosen account-mail provider and recovery flow before enabling public registration. No Gmail password/app password was received, no mail credential or sender was configured, and no email was sent.

## Device copies and offline work
Each account has a separate local cache. Guest entries remain a separate browser workspace until explicitly imported. Offline changes are queued against the last server revision. On reconnection, independent edits merge; conflicting values are both shown and need a choice.

Explicit sign-out saves pending changes first, ends the session and clears the account-bound hut and original planner caches on that device. If an expired/revoked session interrupts an unsynced hut edit, its queue is retained under the original account ID and is loaded only when that account signs in again. A different signed-in account sees an empty/different workspace. Once saved successfully, the recovery copy is removed.

Device copies are ordinary browser storage, not encrypted vaults. Use export/sign-out on a shared device. Signing out one device does not claim to revoke all other sessions. Public service-worker caches contain only public assets/research and private-page shells; they contain no account payloads.

## Read-only sharing
Share creation previews the exact visible title, date and chosen hut/approach references. Optional itinerary notes and day log are off by default. The server checks that the reviewed projection still matches the saved trip; if it changed, creation returns 409 and requires a new review.

The share is a snapshot. Later trip edits do not silently alter an already shared link. Share tokens are random 32-byte values; only their SHA-256 hashes are stored. The raw URL is shown at creation and should be copied then. The owner can revoke the link. Another account cannot revoke it. Revoked links return 404 and are not served offline from a cache.

An unlisted link is readable by anyone who receives it. There is no invitation-only access or shared editing in this release. Consent evidence, private documentary fields, archival rights, drone evidence, user email and account identifiers are excluded from the share projection. Explicit optional note sharing should still be reviewed by the owner.

## Imports, exports and print
Supported imports: alpenverein-hut-bookmarks v1, alpenverein-documentary-plans v1, and vertical-moment-hut-workspace v1. Preview additions, conflicts and skipped records; fill empty values, retain existing nonempty values. The final application rechecks against the latest device state.

Full private workspace export contains personal planning data and should be handled as a private backup. It includes no session token/password. Public hut printing excludes the documentary section. Printing a private trip or explicitly choosing private shoot-plan print includes personal records and labels them.

## Observed checks
Two independent local browser contexts retrieved the same account trip; a different account did not. Forged-origin writes returned 403, invalid identities 400 and stale revisions 409. Share defaults excluded notes/consent, foreign revocation returned 404, and owner revocation made the link unavailable.

Offline and cold-start journeys confirmed saved hut data, queued edits, explicit same-field conflict review, account-scoped expired-session recovery and sign-out cache removal. Cache enumeration found no API, account or share responses. These checks use synthetic localhost accounts; production HTTPS verification is still required.
