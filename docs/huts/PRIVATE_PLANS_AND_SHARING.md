# Personal plans, backups and close-friend use

## Saving

The tool has one workspace per browser. Hut bookmarks, documentary plans, trips, checklist ticks, photography status and day notes are validated and saved locally. The climbing planner keeps its existing separate local copy.

There is no registration, sign-in, email verification, password recovery, account synchronization or remote personal-data API. The hut feature requires no D1 database or account secret.

A reload in the same browser restores saved plans. Normal offline edits save in the same way. If browser storage becomes unavailable, the interface reports that changes are only in memory and retains those edits for export.

Clearing site data, using private browsing or changing devices can lose access to that browser copy. Use Import and export my data to save a separate JSON backup and import a reviewed copy on another device. There is no automatic cross-device synchronization.

## Existing device copies

The new workspace key is vm.huts.local.v1. When it is absent, the tool can recover the last selected cached device copy from the earlier implementation, or the previous vm.huts.guest.v1 browser workspace. This recovery reads local storage only; it performs no network request and keeps older copies intact.

An unreadable saved copy is kept intact instead of being overwritten with an empty workspace. New edits can still be exported. No remote account or database is deleted or accessed by this change.

## Import and export

Supported formats remain alpenverein-hut-bookmarks v1, alpenverein-documentary-plans v1 and vertical-moment-hut-workspace v1.

Imports show additions, retained conflicts and invalid/unknown values. Existing nonempty notes are preserved. Apply rechecks the latest browser workspace, so edits made after the preview opened are retained.

A full workspace export contains personal notes and permission records. Keep it as a backup and share it only intentionally. It does not contain the underlying browser storage metadata or any login credential.

## Giving the tool address to a friend

The hut library and planners follow the existing unlisted, direct-link approach. They are excluded from the sitemap, carry noindex/nofollow metadata and headers, and are not added to public photography navigation.

Someone who receives the address can open the research and use their own browser workspace. Your notes, trips and documentary plans do not travel with that address. Unlisted pages do not enforce identity or password checks.

Copy address in the climbing planner copies the tool address only. Server-generated trip links and revocation services are removed. To share selected itinerary information, use the existing print action or intentionally send an export. Research-guide printing excludes documentary notes unless the owner chooses the explicit private-plan print action.

## Research boundaries

Personal records never replace reviewed hut facts. Source dates, limitations, historical tariff years, published walking times and permission qualifications remain visible. A checklist tick or personal note establishes no current access, reservation or filming permission.
