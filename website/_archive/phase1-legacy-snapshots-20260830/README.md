# Phase 1 legacy website snapshot archive

`routes.json` and `crags.json` were old compact website projections. They were
used by legacy browser components but did not represent the full canonical
dataset: the old crag snapshot contained 254 crags instead of 330.

The active files at `website/app/(platform)/data/routes.json` and
`website/app/(platform)/data/crags.json` have been regenerated as compatibility
projections from `database/master/vertical-moment-canonical.json`.
