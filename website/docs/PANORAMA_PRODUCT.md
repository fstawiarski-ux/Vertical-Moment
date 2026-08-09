# Vertical Moment panorama product

## Product position

Panoramas are a secondary Vertical Moment product with three uses:

1. **Photography gallery** — a `Panoramas` filter shows the public collection without mixing print masters into the site.
2. **Climbing platform** — a panorama can orient a region or crag and link to sectors, but remains a `provisional-regional-reference` until geometry is registered and field checked.
3. **Print inquiry** — the visitor chooses an image and asks for a size. Crop, colour, paper and production are confirmed before an order is accepted.

The photograph is never treated as verified route data by itself.

## One-master, two-web-file policy

| Tier | Purpose | Storage | Delivery |
| --- | --- | --- | --- |
| Master PNG | print production, future re-edit | private archive | never bundled with the website |
| Preview WebP | detail viewer | public web storage | only opened for the selected panorama |
| Thumbnail WebP | filters, cards, mobile lists | public web storage | lazy-loaded |

The current nine PNG masters total about **122 MB**. The complete generated web set is about **9.9 MB**: **8.8 MB** of selectable previews and **1.1 MB** of thumbnails. A normal page view does not request the whole set.

## Repeatable ingest

Run from `website/`:

```text
node tools/prepare-panoramas.mjs <private-source-folder> public/photography/panoramas/wachau
```

The script:

- reads but never modifies the source PNGs;
- removes only declared stitch-canvas edges from web derivatives;
- creates a 1,000 px thumbnail and a 2,400–3,200 px proof;
- writes source checksums and derivative sizes to `manifest.json`;
- makes duplicate or changed masters visible before new processing work is repeated.

## Record required by website, platform and app

`app/data/panoramas.ts` is the current canonical catalogue. Each record carries:

- stable `id` and source filename;
- public thumbnail and preview;
- source and display pixel dimensions;
- region and visual category;
- alt text and a short product description;
- recommended 300 ppi width and 240 ppi display-proof width;
- print proof status;
- provisional reference status and field-verification note.

The same shape can later be returned by the platform API. A mobile screen should request the thumbnail first, open the preview on demand, and never request the print master.

## Quality gate before a panorama is sold

1. Confirm the precise place/crag/sector association.
2. Inspect stitch seams and choose the final print crop.
3. Soft-proof colour for the selected paper and printer profile.
4. Confirm the requested physical size against native pixels.
5. Produce a small proof or test strip.
6. Mark the record print-ready only after approval.

Files 9, 10 and 15 currently remain `proofing-required` because their web presentation uses a stitch-edge trim. The originals remain untouched.
