# Vertical Moment — beta

A single-page climbing browser for the crags around Vienna & Niederösterreich.
Map (region → crag → route drill-down), a filterable catalogue of 632 routes and
254 crags, and a contributor workspace for collecting field data.

**Everything lives in one file — `index.html`.** No build step, no server.

## Run it locally
Download `index.html` and **double-click it**. It opens in any browser.
(An internet connection is needed for the map tiles, fonts, and route-elevation
lookups — everything else is offline.)

## Publish it & share the link (GitHub Pages)
1. Create a **new public repository** on github.com (e.g. `vertical-moment`).
2. On the repo page click **“uploading an existing file”**, drag in
   `index.html` and this `README.md`, and **Commit**.
3. Go to **Settings → Pages**. Under *Source* pick **Deploy from a branch**,
   branch **main**, folder **/(root)**, and **Save**.
4. Wait ~1 minute. A public URL appears:
   `https://<your-username>.github.io/vertical-moment/`
5. **Send that link to anyone.** It opens on phones and laptops — no install.

## What works / what doesn't (beta)
- ✅ Map, layer switcher, tree navigation, route details, distance measure, filters.
- ✅ Contribution flow — checklist, file drop, notes, submit confirmation.
- ⚠️ Uploaded files and contribution drafts are stored **in the browser only**
  (localStorage). Nothing is sent anywhere yet — that's wired up when the backend
  (Cloudflare D1/R2) is switched on in the full version.
- ⚠️ Google map layers use an unofficial tile source — fine for a personal beta,
  not for production.

## Data & attribution
Crag names and coordinates are derived from **© OpenStreetMap contributors
(ODbL 1.0)**. Route grades and details come from the project's own catalogue.
