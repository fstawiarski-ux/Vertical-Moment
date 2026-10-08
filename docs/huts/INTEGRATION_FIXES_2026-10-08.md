# Current hut integration corrections

The reviewed research remains release 2026-10-08-r3. The checksum correction and generation-before-verification correction remain in the personal-tool version.

Research uses a UTF-8 LF-normalized checksum with explicit format metadata. Both the website generator/verifier and master exporter use it, so Windows and Git/Linux copies agree without weakening content validation.

predeploy and preupload generate ignored hut assets before verifying research. Their final verification now confirms the browser-only design; no account/database configuration is required.

The former account synchronization/conflict system has been removed at the owner's request. Personal bookmarks, plans, notes and trip logs save in browser storage. The current regression cases cover device-copy recovery, repeated edits, a second tab's changes, storage failure and unreadable saved copies.

Account routes, email/login UI, server-created sharing, authentication dependencies, hut D1 binding/migrations and the climbing planner's account bridge are absent. Import/export, print, research reading, offline downloads and the climbing trip-rendering correction remain.

Current behavior and validation are documented in PRIVATE_PLANS_AND_SHARING.md and PERSONAL_TOOL_VALIDATION_2026-10-08.md. Earlier ZIPs, bundles and account-based validation reports are superseded by the personal-tool handoff.
