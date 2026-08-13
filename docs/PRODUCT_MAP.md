# Vertical Moment product map

**Status:** Accepted boundary; runtime separation staged
**Updated:** 2026-08-13

## Product A — public website

Purpose: photography portfolio, gallery, business/contact, social presence, prints and public SEO.

Current primary ownership:

- `website/app/page.tsx`
- `website/app/public-site-v5.css`
- `website/public/public-site-v5.js`
- `website/app/photography-home.module.css`
- `website/app/photography-theme.css`
- `website/app/components/photography-*`
- public-site-only photography derivatives
- public homepage metadata and explicitly approved sitemap records

Public-site work does not own climbing routes, topo, the Atlas, Nasenwand spatial experiences, the PWA manifest or offline behavior.

## Product B — Climbers Lounge / Explore PWA

Purpose: one installable/offline climbing product containing the Explore Lab workspace and the Atlas/route/spatial experience.

Current primary ownership:

- `website/src/**`
- `website/app/explore-app/**`
- `website/app/(platform)/explore/**`
- `website/app/(platform)/contribute/**`
- `website/app/(platform)/report/**`
- `website/app/climbers-lounge/**`
- `website/app/offline/**`
- `website/app/nasenwand-concepts/**`
- `website/app/components/nasenwand/**`
- climbing-experience panorama/vision modules
- `website/public/explore-content.json`
- PWA manifest/icons, PWA-specific media and `website/src/pwa/**`
- `website/serwist.config.mjs`
- local contribution storage/export helpers under `website/lib/contribution-local.ts`

The names “Explore Lab” and “Climbers Lounge” describe versions/surfaces of this one product. Do not create a third product lane for an installed app name.

## Shared foundations

The following are cross-product until package separation is complete:

- `website/package.json` and lockfile;
- `website/next.config.mjs`, OpenNext and Wrangler configuration;
- root Next layout, global CSS and not-found handling;
- GitHub Actions;
- `database/`, stable route identities and API generation;
- brand assets and any media intentionally reused by both products;
- shared Cloudflare account, Workers/R2 policies and domain routing.

Any change here must declare compatibility impact for both products.

## Current route classification

| Route or surface | Product | Discovery policy |
|---|---|---|
| `/` | Public website | Public |
| approved gallery/contact/print pages | Public website | Public after review |
| `/climbers-lounge` | PWA bridge | Public bridge only; no private-app exposure by implication |
| `/explore-app` | PWA | Private beta; no public navigation link without approval |
| `/explore` and region/crag descendants | PWA | Protected development stream |
| `/contribute` and `/report` | PWA companion | Unlisted/noindex local-first beta; reachable from the PWA, with no server upload or automatic publication |
| `/offline` | PWA | PWA support route |
| Nasenwand/topo/3D/spatial concept routes | PWA | Protected climbing-experience stream |

## Target package layout

After both live products have approved visual and behavior baselines:

```text
apps/
  public-site/
  climbers-lounge-pwa/
packages/
  brand/
  climbing-data/
  shared-media/
```

The migration must be behavior-preserving and reviewed in small stages. Do not duplicate canonical route data or source media merely to make the folders look separate.
