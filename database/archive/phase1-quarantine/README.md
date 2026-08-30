# Phase 1 Quarantine — Matterhörndl Routes

**Status:** quarantined, not permanently deleted
**Date:** 30 August 2026
**Reason:** owner-approved removal from the active working-copy product data because these 12 records were not relevant and carried stale Explore coordinates.

## Contents

`matterhorndl-routes-20260830.json` contains the complete original route records.

## Active working-copy effect

The 12 routes were removed consistently from the working-copy versions of:

- `database/master/vertical-moment-canonical.json`
- `database/api/v1/routes.json`
- `database/api/v1/search-index.json`
- `database/api/v1/crags/modling/matterhorndl.json`
- `database/api/v1/regions/modling.json`
- `database/api/v1/crags.json` statistics
- `database/api/v1/regions.json` statistics
- `database/api/v1/index.json` statistics and affected endpoint sizes
- `website/app/(platform)/explore/atlas-data.json`

The Matterhörndl crag remains as an empty/stub-like location record so links and taxonomy do not silently disappear. Its active route count is zero.

## Rollback

The original active files were copied before quarantine under:

```text
work/main-matterhoerndl-before-quarantine/
```

The original supplied ZIP archive remains untouched. Permanent deletion is a separate future decision.
