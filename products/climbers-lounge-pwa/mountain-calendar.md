# Austria mountain calendar

Product scope: `climbers-lounge-pwa`. Catalogue baseline: 14–15 October 2026. Competition details: 18 October, with selected official-source checks on 21 October 2026.

## Runtime and editing

`website/app/explore-app/planner/PlannerFrame.tsx` embeds the self-contained
`website/public/explore-app/planner-content.html` at the existing planner URL.
The HTML contains its CSS, JavaScript, event catalogue and programme directory;
there is no new API, dependency, external script or runtime data fetch.

The `<script id="data" type="application/json">` block is the catalogue source
for this static planner. Its `cal` array contains event records, `programmes`
contains undated announcements and official programme sources, and `coverage`
records counts, source-identity merges, research boundaries and date warnings.
Every new listing has source evidence and a public contact or enquiry route.
Date checks and organiser availability are a snapshot, not a live booking feed.

Preserve event numbers and `sourceKey` identities when refreshing the catalogue.
IDs 1–110 are from the previous repository version; IDs 111–122 also preserve
the preceding local research edition. New catalogue IDs start at 1000.
Distinct Alpenverein booking codes remain separate groups. Naturfreunde entries
with the same official page, date range and published time are combined;
different published appointment times remain separate.

## Coverage and display

- 3,186 runtime listings: 2,612 Austria, 128 foreign or spanning countries, 446 whose
  destination still requires confirmation.
- Counts include separate bookable course cohorts and explicitly dated recurring
  appointments. A long course is not expanded into an assumed daily recurrence.
- New research primarily spans 14 October 2026 through 31 December 2027. Earlier
  original records remain available for tracking.
- 22 programme sources include announced hut anniversaries without a fixed day.
  Those sources are not counted as dated event appointments or exported to ICS.
- The sources include Alpenverein Austria/Edelweiss/Gebirgsverein/Akademie and
  selected Graz/Innsbruck listings; Naturfreunde national and local calendars;
  Austrian ORTOVOX courses; SAAC camps; Sicheres Vorarlberg; Austria Climbing;
  EOFT, Banff, Mountains on Stage, Mountainfilm Graz, brand events, national park
  activities and published hut celebrations.
- This is a broad researched catalogue, not an exhaustive national register.
  Smaller club and hut announcements and later programmes need further updates.

The calendar offers country scope, all nine Austrian provinces, discipline,
event type, organiser, safety/culture topic, schedule and date filters. Cards and
List render 24 results per page; exports use all filtered results. Month view
places a course series on its start date or its explicitly published sessions.
Unclear destinations are excluded from both Austria and Other countries.

Conflicts, provisional dates, cancellations and postponements are visibly
labelled. ICS excludes unsettled dates and uses all-day placeholders; it does
not invent daily or weekly course sessions. CSV protects formula-like fields.

## Storage, privacy and updates

Personal notes, event status, trip plans and outreach remain under the existing
`climbplanner.v1` browser storage key. The original event/pitch keys are retained;
new recurring appointments and cohorts have separate pitch identities. Export
and import backups when changing browser, device or local-file origin. A backup
import or clear keeps a local recovery copy. Source contact routes do not imply
photographer access or permission to publish photos.

This change does not add account synchronisation to the embedded calendar.
The existing hut-trip tools remain separate. Only the static researched
catalogue is committed; browser planning state and credentials are not included.

The existing `website/serwist.config.mjs` computes `plannerRevision` from the
planner HTML and wrapper files and uses it for both planner precache URLs.
Updating the HTML therefore changes the installed PWA cache revision without
changing the shared service-worker configuration. Generated `public/sw.js`
must not be committed.

## Verification and rollback

Run from `website/`:

```text
npm test -- src/core/mountainCalendar.test.ts
```

The tests read the actual published HTML and exercise country/province/topic
filters, identifiers, explicit sessions, inclusive date intervals, disputed-date
exclusion, CSV escaping, backup validation and ICS date/UTF-8 folding.

Browser QA of the approved local artifact covered desktop 1440×1000, phone
390×844 and narrow 320×780 reflow, keyboard month navigation, dialog focus,
notes surviving reload, contact/programme searches, light/dark themes, and
actual CSV/ICS downloads containing all 108 results in a multi-page filter.
Twenty palette contrast pairs passed; the lowest tested normal-text contrast
was 5.85:1. This is targeted QA, not a screen-reader audit or WCAG certification.

For an integration change, also run the repository data/security checks,
typecheck, full unit suite and Next/Serwist build. Inspect the generated service
worker's planner entries without including generated files in the diff.

Rollback is a reviewed revert of this PR. The existing iframe path and browser
storage key remain stable, so reverting the presentation does not delete
personal planning state. Publishing remains controlled by the existing release
workflow after the owner reviews and merges the PR.


## Competition photography focus — 21 October 2026

The planner opens with a focused photography view: Recommended, All competitions,
and My shortlist. Recommended combines the next dated opportunity with upcoming
Vienna options. Optional search, location, period, discipline, audience and date
filters remain combinable. Junior filters include verified mixed age events.

The original 3,185-record JSON block remains intact. A documented PF_RESEARCH
overlay immediately enriches the shared D.cal catalogue before either view
renders. It preserves original numeric IDs, combines the two Innsbruck sessions
for reading without changing their underlying dates, corrects the two community
competition classifications, and adds Royal Flash 4.0 as ID 9000 with a stable
source identity. The full calendar uses this same resulting 3,186-record catalogue.
Only the 15 curated entries receive the newer checks; other research retains
its original source dates and qualifications.

Personal shortlist and access fields use additive photo:<event ID>:... keys
inside the existing climbplanner.v1 state. Shooting notes and delivery retain
the existing event keys. The full calendar and backup format remain available.
Backup restore adds missing entries and retains current differing values.
Shortlist print preview includes only the selected public event details, excluding
private shooting notes. Calendar export retains source sessions as all-day entries
and excludes unsettled dates through the existing export function.

The route wrapper uses one viewport frame, with sharing/device tools in the
focused document. Hut library/trip links remain under Tools. This avoids the
previous stacked navigation and always-visible copy-address panel.

Verification on Node 24 after `npm ci --no-audit --no-fund`:

- `npm test`: 172 tests passed in 21 files, including 26 calendar/focus tests.
- `npx tsc --noEmit -p tsconfig.json`: passed.
- `npm run sync-data`, `npm run sync-huts`, `npm run verify-huts`,
  `npm run verify-data`, `npm run verify-canonical`, `npm run verify-pwa-content`,
  `npm run verify-personal-huts` and `npm run verify-security`: passed.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-repository-contract.ps1`
  from the repository root: passed.
- The two JSON schema commands in `.github/workflows/validate-data.yml`, using
  `ajv-cli@5.0.0`: passed.
- `npm run build`: the full Next/Serwist build passed (1,009 static pages).
- `npm run build:cloudflare`: the complete local OpenNext worker build passed.
- Generated `public/sw.js` contains both planner precache URLs with the same
  content-derived revision. The worker and generated reports stay out of the PR.

Browser checks covered combined Vienna/bouldering filters, save/reload/access
notes, backup restore with synthetic data, selected printing excluding private
notes, full-calendar Royal Flash lookup, keyboard focus and 320 px narrow reflow.
The built Cloudflare worker was also checked locally: the focused default,
All competitions, full-calendar/return navigation and the single viewport frame
worked, with no captured browser errors. The HTML is byte-identical to the
accepted local preview (SHA-256
`d59cfa6029fdcfedc0385b5908d7019875619cde7cb3637a80c71af858da27c9`).

Physical-device, screen-reader and an installed-app update from the deployed
version remain owner release checks. This is targeted accessibility testing.
The PR is for review only; the owner tests and merges manually. No deployment
is requested as part of preparing the PR.
