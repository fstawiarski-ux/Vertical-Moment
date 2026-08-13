# Public Vertical Moment website

## Mission

The public product presents Vertical Moment as a climbing/outdoor photography business: portfolio, story, gallery, contact/conversion, social presence, prints and public search metadata.

## Current ownership

Primary current files include:

- `website/app/page.tsx`
- `website/app/public-site-v5.css`
- `website/public/public-site-v5.js`
- `website/app/photography-home.module.css`
- `website/app/photography-theme.css`
- `website/app/components/photography-*`
- public photography assets used only by those components
- public metadata, Open Graph and sitemap entries explicitly approved for the public site

`/explore`, `/explore-app`, `/climbers-lounge`, Nasenwand climbing experiences, route data, topo, 3D and offline behavior belong to the Climbers Lounge/PWA stream even when they are rendered by the same Next.js package.

## Current canonical status

- Current committed/deployed integration baseline: `main` at `da6630cdcba8ed2d44015ed1cea9af47bdc99971` when this record was updated.
- Public V5 shipped through PR #33 at `3640c12e0cafe6947440a4f603f998a49f4aa66a` and passed the production deployment workflow.
- The standalone V5 prototype and recovery ZIP remain historical evidence, not runtime source.
- Logo, background, fonts and photography refinements are intentionally deferred to focused `site/` work; preserve the live V5 structure while changing them.

## Branch and validation

Use `site/<task>`. Do not link to or expose the private PWA as part of public-site work without approval.

Before review: inspect mobile and desktop layouts, navigation, gallery, contact/conversion, metadata, performance and accessibility. Validate the full shared Next build because both products currently compile together.

## Safe content replacement map

| Content | Reviewed repository location | Rule |
|---|---|---|
| Public V5 page sequence and copy | `website/app/page.tsx` | Keep product logic in the public-site lane; do not edit PWA routes as a side effect |
| Public V5 layout/theme | `website/app/public-site-v5.css` | Preserve a before screenshot and test phone/desktop after replacement |
| Public V5 interactions | `website/public/public-site-v5.js` | Treat as runtime code, not an upload folder |
| Public photography derivatives | `website/public/photography/` | Add optimized web derivatives with stable descriptive filenames; preserve raw masters outside the deploy path |
| Canonical brand masters | `assets/brand/canonical/` | Never overwrite a master; add a reviewed version and checksum |
| Web brand derivatives | `website/public/brand/` | Update only after the canonical master is approved |

Do not solve content management by dropping arbitrary raw files into Git. A future media manifest/uploader should write versioned derivatives and metadata, while masters remain in approved private storage.
