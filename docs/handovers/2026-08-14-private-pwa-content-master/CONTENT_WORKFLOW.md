# Controlled content workflow

The goal is to let the owner add content gradually without mixing private masters, canonical climbing facts, generated mirrors, and deployable derivatives.

## Source-of-truth rules

1. The owner keeps raw photo, video, panorama, audio, 3D, GPX, PDF, and rights evidence in the private intake root described in `FOLDER_MAP.md`.
2. A content record receives a stable ID before it is connected to a page or box.
3. Verified route facts are entered into the canonical database workflow. Do not hand-edit `website/public/data/v1/`.
4. PWA card content and asset references live in `website/public/explore-content.json`.
5. The data mirror and atlas bridge are generated with `website/scripts/sync-data.mjs`.
6. Heavy masters remain private. Only approved, optimized derivatives enter `website/public/`.
7. A content change is not published until its status is `APPROVED` and the QA evidence is attached to the review package.

## One content batch

Use small, reviewable batches. The recommended first batch is:

```text
1 region
  -> 1 crag
    -> 1 sector
      -> 1 route set or field note set
      -> 1 approved image/panorama derivative set
      -> 1 PWA card or page connection
```

For a normal card, provide one record and one primary image family. For a panorama, provide one panorama record plus its preview family and rights/source note. For a route set, provide the canonical rows and evidence state; do not add a route merely to fill a visual box.

## Status gate

| Status | Meaning | May enter the deployed app? |
| --- | --- | --- |
| `MISSING` | Required input has not been supplied. | No |
| `INBOX` | Raw material received; no interpretation made. | No |
| `SOURCE-REVIEW` | Identity, rights, location, and source are being checked. | No |
| `DERIVATIVE-READY` | Approved source has a planned web derivative set. | No |
| `QA-READY` | Derivatives and record are assembled for device and content QA. | No |
| `APPROVED` | Owner accepted the review package. | Yes, after the reviewed PR is merged/deployed. |
| `PUBLISHED` | The approved change is confirmed on the intended deployment. | Yes |
| `UNVERIFIED` | A fact or geometry is intentionally not confirmed. | Only when visibly labelled and the module supports it. |
| `PROVISIONAL` | A working study is shown without presenting it as final. | Only with explicit labelling. |

## Page and box filling order

Fill content in this order so every addition has a destination and a return path:

1. Region identity: name, stable slug, short description, verified map/source state.
2. Crag identity: name, region link, access/parking evidence if approved, source state.
3. Sector identity: name, crag link, wall/topo/panorama relationship, verification state.
4. Route or field record: stable route ID, name, grade/source, location confidence, evidence.
5. Primary media: one approved image or panorama preview with alt text, caption, rights note, and derivative family.
6. PWA box: box type, title, region, crag, optional sector, description, data reference, and initial layout.
7. Return links: every detail view needs a visible path back to its parent region/crag/sector.
8. Offline entry: add only small same-origin indexes to `offlineData`; add heavy media to `heavyAssets` only after cache-size review.

## Review handoff contents

Every batch in `04-REVIEW-PACKAGES` should contain:

- the record JSON;
- a list of source file names and checksums;
- rights/provenance notes;
- derivative dimensions and byte sizes;
- screenshots at phone, tablet, and desktop widths;
- link and keyboard results;
- explicit `APPROVED`, `UNVERIFIED`, or `PROVISIONAL` decisions;
- the exact intended repository paths;
- a note saying whether the change is local, in a PR, merged, or deployed.

No PR is approval. No merge is deployment. No deployment is evidence that a climbing fact is verified.
