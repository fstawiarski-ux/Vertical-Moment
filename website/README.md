# Vertical Moment website

> **Transitional combined runtime:** this package currently contains two products. Read the repository root `README.md`, `AGENTS.md` and `docs/PRODUCT_MAP.md` before editing. Public-site tasks use `site/` branches; Climbers Lounge/Explore PWA tasks use `pwa/` branches. Do not use installed PWA names as separate product identities.

This package contains the live Vertical Moment public photography site and the active **Climbers Lounge / Explore Lab** PWA family.

## Public bridge and private lab

The public photography product and the climbing product share one deployment but have separate route ownership. `/climbers-lounge` is the public bridge; `/explore-app` is the workspace; `/explore` is the PWA atlas/region/crag experience.

The unlisted `/contribute` companion is a local-first field beta. It is `noindex`, stores original files in device IndexedDB and exports ZIP review packages. It has no server upload, account gate, review queue or automatic publication yet. Hiding or omitting a URL is not authentication.

## Explore Lab

Explore Lab turns selected Vertical Moment photography, route data and spatial studies into a locked, desktop-like canvas. Content appears in draggable and resizable boxes instead of a conventional page. A box can be minimized, expanded, opened fullscreen or promoted to the background hero.

The layout toolbar provides three structural modes:

- **Explore** keeps a loose freeform canvas.
- **Grid** snaps boxes into a practical desktop grid.
- **Present** applies a clean hero-and-column arrangement.

Layout state, box modes and the promoted hero are persisted locally. Mobile uses a touch-first card stack while expanded boxes become full-screen workspaces.

### Integrated modules

- **ScrollScrubHero** preserves the existing Nasenwand close-wall scrub as the shared app-shell hero.
- **Crag Locator** provides native search, region/crag drill-down, route lists, GPX links, directions and lazy map tiles without the old Explore page navigation or footer.
- **Wachau Panorama** provides Region, Crag, Sector and Google 360-degree views, a nine-study gallery, drag/slider panning and an explicit 10.3 MB offline pack.
- **Nasenwand Routes** preserves supplied sector counts and Upper Sector route facts while withholding unverified route geometry.
- **Wall Reveal** keeps the place-to-route narrative and media budget while reusing the shared scrub and shared 3D box. Its legacy 17.7 MB scrub is not loaded.
- **Nasenwand 3D** loads the optimized GLB and model-viewer library only after the user asks for it.

### PWA and offline behavior

The manifest installs the app on a phone as **Climbers Lounge**, while the approved workspace retains its internal Explore Lab identity. Install icons and the Serwist service worker provide an installable app shell. The service worker:

- precaches the Explore Lab route, contributor route, offline fallback, registry, icons and Leaflet runtime;
- precaches the `/explore`, Nasenwand and Wall Reveal route shells while keeping those spatial surfaces out of public discovery;
- caches images, the shared scrub, GLB model and recently viewed map tiles in separate bounded caches;
- keeps heavy panorama derivatives behind the user-triggered Wachau offline pack;
- falls back to `/offline` when an uncached document cannot be reached.

Google 360-degree imagery and uncached map tiles remain network-dependent. Locally cached layout, route data, app shell and explicitly saved media continue to work offline.

## Local development

Install dependencies once:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create the production build, including the service worker:

```bash
npm run build
```

Preview that production build locally:

```bash
npm start
```

Then open `http://localhost:3000/explore-app`. Use `http://localhost:3000/contribute` for the unlisted local field beta.

`npm run preview` is reserved for the OpenNext/Cloudflare preview workflow. Cloudflare publication remains separate from a GitHub push and requires explicit cutover approval.

## Data layers

- `app/data/routes.json`: existing 632-route website snapshot.
- `database/api/v1/`: generated canonical route export served through the website mirror.
- `app/data/review-routes.json`: separate 188-route guidebook reconciliation overlay.
- `/review-preview`: filterable source-evidence and reconciliation review page.

The reconciliation overlay does not modify the canonical master workbook. Authentication remains a stub, contribution drafts remain local, and production D1/R2 integration is still pending.
