# Workbench

This is the intake and processing space for small, versioned source files: GPX-derived sector maps, working route context, draft guidebook chapters, and drone mission drafts. It is deliberately separate from the canonical `database/` and published `areas/` records.

## Rules

1. Add small, editable files here first. Keep multi-GB scans, raw photos and video in external source storage; commit a manifest or link when they are ready.
2. An intake file is not an approved fact. Copy or transform it into `database/` or `areas/` only through a reviewed pull request.
3. Preserve source names in the commit history. Where a name is known to be misleading, the destination folder uses the corrected working name and the warning is recorded below.
4. Treat access, drone, sun/shade, terrain and route information as provisional until independently checked.

## Current intake packages

| Package | Working status | Main use | Hold before publication |
|---|---|---|---|
| `area-intake/wachau` | usable working data | 38 sector points, map export, terrain/sun/route estimates and chapter draft | Confirm terrain and access facts; walking is not turn-by-turn navigation. |
| `area-intake/helenental` | review required | 17 sector points, grouping, chapter draft and restrictions warning | Check current Biosphere Park restrictions and reconcile with the Master v1 Höllental records. |
| `area-intake/bad-fischau` | partial working data | 8 sector points and chapter draft | Source GPX and sun/shade output are absent; travel estimates use straight-line assumptions. |
| `area-intake/kaltenleutgeben-rodaun` | review required | 18 points, source GPX and chapter draft | The supplied files were labelled Peilstein but the coordinates describe Kaltenleutgeben/Rodaun, not Peilstein. |
| `guidebook-references` | reference only | Weekend-planning draft | Route names and selections are explicitly unverified; do not merge into Master v1. |
| `drone-missions/wachau/draft` | draft only | Litchi orbit/grid mission sources | Must be manually checked in Mission Hub and against current airspace, permissions, weather and site restrictions before flying. |

## Processing path

`workbench` → review source and warnings → transform to canonical `areas/` and `database/` records → validate → pull request → publish.
