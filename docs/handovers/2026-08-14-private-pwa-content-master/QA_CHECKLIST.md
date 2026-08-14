# Content and release QA checklist

Run this checklist for every content batch. Record evidence in the review package and state whether the result is local, in a PR, merged, or deployed.

## Boundary and privacy

- [ ] `/climbers-lounge` shows Coming Soon and no private app/catalog CTA.
- [ ] `/start` lands on `/climbers-lounge`.
- [ ] Direct `/explore-app` still loads for an intentionally shared link.
- [ ] `/explore-app` metadata remains `noindex, nofollow`.
- [ ] No private master, credential, personal data, or unapproved rights material is in the deployable tree.
- [ ] The handoff does not describe an unlisted URL as authentication.

## Content and data

- [ ] Stable IDs are unchanged for edited records.
- [ ] Region -> Crag -> Sector -> Route relationships are explicit.
- [ ] Unsupported facts are labelled `UNVERIFIED` or `PROVISIONAL`.
- [ ] Canonical data was updated at the source; generated mirrors were refreshed with `npm run sync-data`.
- [ ] `npm run verify-data` passes.
- [ ] Empty, missing, back, close, and retry states have a destination.

## Media

- [ ] Source masters remain in private intake.
- [ ] AVIF and WebP derivatives have the required widths and matching crop/focal point.
- [ ] Registry width, height, `sizes`, `srcSet`, alt, and fallback are present.
- [ ] Video duration and direction match the actual media.
- [ ] Heavy media is lazy and is not added to the offline pack without a cache-size decision.
- [ ] Model/panorama has a poster, loading state, source state, and return path.

## Device and interaction

- [ ] Phone: 390 x 844, touch targets, no horizontal overflow, usable card stack.
- [ ] Tablet: 820 x 1180, grid behavior, drag/touch and keyboard behavior.
- [ ] Desktop: 1440 x 900, freeform layout, no clipped controls.
- [ ] Region/Rock/Sector/Topo stations work as direct buttons.
- [ ] Continuous scrub remains usable with drag and slider.
- [ ] Keyboard focus, `aria-current`, and reduced-motion behavior are correct.
- [ ] Heavy modules open intentionally and do not block the first frame.

## Build and publication gates

- [ ] `npm test` passes.
- [ ] `npm run build:next` passes from the review checkout.
- [ ] `npm run build:cloudflare` passes when the change touches the serving build or PWA assets.
- [ ] `git diff --check` and `git diff --cached --check` pass.
- [ ] Staged file names were reviewed explicitly; no generated or unrelated files were staged.
- [ ] PR, merge, and deployment state are reported separately.
