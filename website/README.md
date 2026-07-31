# Vertical Moment — website (Next.js)

The contributor-platform successor to the root `index.html` beta. Same map,
same data, but region → crag → route **drill-down** instead of a flat table of
632 routes, plus a foundation for real sign-in and reviewed submissions.

An earlier plan built this against a ChatGPT-App-SDK starter (Sign-in-with-
ChatGPT, "vinext"). That's been dropped in favor of a standard Next.js app
you can build, run and deploy yourself — no dependency on an external
starter repo.

## Structure

```
app/
  layout.tsx, globals.css        shared chrome, fonts, theme toggle
  page.tsx                       home — hero + CragMap (region → crag → route)
  explore/page.tsx               search-to-drill-down (no flat route table)
  contribute/page.tsx            mission checklist + evidence upload
  components/                    CragMap, ExploreBrowser, ContributeWorkspace, nav/footer
  data/                          crags.json (254), routes.json (632), missions.json
db/schema.ts                     Drizzle schema for Cloudflare D1 (Phase 3 — not wired up yet)
lib/identity.ts                  viewer lookup — currently a stub (anonymous). Phase 3 swaps
                                  this for a real Auth.js (email magic link) session.
lib/r2.ts                        dormant R2 upload helper for contributor evidence (Phase 3)
```

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Current state (Phase 2 — read-only)

- ✅ Map, region → crag → route drill-down, theme toggle — same as the beta.
- ✅ Explore is now **search-first**: type a route/crag name, results link
  straight into the map's drill-down (`/?crag=<name>`). No more dumping all
  632 rows into a table. Routes not yet joined to a mapped crag (most of them
  today — only 26 of 254 crags have catalogued routes) show up in search as
  informational, non-clickable rows rather than a broken link.
- ✅ Contribute UI works end-to-end, but drafts still only save to
  `localStorage` — nothing is sent to a server yet.
- ⚠️ No authentication yet — every visitor is anonymous (`lib/identity.ts` is
  a stub). No database — `app/data/*.json` is a static snapshot, not live D1.

## Regenerating the data

`app/data/crags.json` / `routes.json` are a snapshot taken from
`database/generated/routes_v1.json` and `database/master/vertical_moment_master_routes_v1.xlsx`.
There is no automated regeneration script yet — when the master data changes,
these two files need to be regenerated and dropped back in here.

## Next: Phase 3 (contributor accounts)

Email magic-link auth via Auth.js + `@auth/d1-adapter`, wiring `db/schema.ts`
to a real Cloudflare D1 database, enabling `lib/r2.ts` against a real R2
bucket, and a review queue for submissions. None of that is required for this
phase to be useful on its own — Map/Explore are fully functional read-only
today.

## Deploying (Phase 2 deploy step — not done yet)

Target is **Cloudflare Pages** via `@cloudflare/next-on-pages`, matching the
D1/R2-oriented schema already written. Needs a Cloudflare account:

```bash
npm i -D @cloudflare/next-on-pages wrangler
npm run pages:build
npm run pages:deploy
```

The root `index.html` / GitHub Pages beta keeps serving untouched until this
is reviewed and explicitly cut over.
