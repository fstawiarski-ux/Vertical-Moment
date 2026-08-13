# Transitional combined runtime rules

`website/` currently compiles both the public website and Climbers Lounge/PWA. Read the root `AGENTS.md` and `docs/PRODUCT_MAP.md` first.

- Declare `public-site`, `climbers-lounge-pwa` or approved shared scope.
- Do not move runtime files across product boundaries without the staged package-migration plan.
- Treat `package.json`, lockfile, `next.config.mjs`, OpenNext, Wrangler, root layout/global CSS and workflows as shared.
- `public/sw.js` is generated. Never edit it or ship it in a source patch.
- Run the full Next build for changes that touch shared runtime foundations.
- Do not expose `/explore-app` through public navigation without approval.
- `/contribute` is a PWA companion beta. It is unlisted/noindex and local-first; do not claim a server upload, review queue or publication until those systems exist.
