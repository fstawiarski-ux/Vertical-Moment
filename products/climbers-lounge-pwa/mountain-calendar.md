# Austria mountain calendar

Product scope: `climbers-lounge-pwa`. Catalogue baseline: 14–15 October 2026. Competition details: 18 October, with selected official-source checks on 21 October 2026.

The [November update](#calendar-and-photography-outreach--23-november-2026)
records the current catalogue totals and outreach changes.

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

## Calendar and photography outreach — 23 November 2026

The November review added 230 listings and refreshed 12 existing records from
official sources. The full calendar now has 3,416 runtime listings, including
2,818 in Austria and 446 with an unresolved destination. New and refreshed
listings carry their individual check dates. New event IDs are 9001–9230.
Existing event IDs and source keys still identify the same events.

The calendar defaults to List for first-time visitors. Cards and Month remain
available, and returning visitors retain their chosen view. Search matches
multiple words across title, place, organiser and contact in any order and
ignores accents. Date and province controls sit above shortcuts for Photography,
Competitions and Gear & brands. Event details hold the timetable, photo access,
source evidence, contacts and planning fields. Expanding a card loads those
details. Listings with a date warning show it on the collapsed card.

Organisers & contacts lists ten official Austrian sources with bookmark buttons,
category filtering and a Saved only view. Bookmark selections are local and
included in the Planner backup. Event contacts, including personal event contact
entries, are available in a separate expandable directory.

- Club and media routes include the climbing federation, Alpenverein FotoPool
  and the Austrian photography association.
  [Austria Climbing](https://www.austriaclimbing.com/media.html),
  [Alpenverein FotoPool](https://www.alpenverein.at/portal/fotopool/index.php),
  [ÖVF](https://www.oevf.at/kontakt/)
- Workshops, exhibitions and local shoots can be researched through the
  Gesäuse photo school, the Photo+Adventure organiser and das flash.
  [Gesäuse Fotoschule](https://nationalpark-gesaeuse.at/nationalpark-erleben/nationalpark_gesaeuse_fotoschule/veranstaltungen/),
  [Photo+Adventure](https://www.photoadventure.at/team/),
  [das flash](https://www.dasflash.at/events.html)
- Product coverage and production contacts include a Tyrolean climbing
  equipment company, a Vienna photo lab and two Wels stamp manufacturers.
  [AUSTRIALPIN](https://www.austrialpin.at/unternehmen/),
  [cyberlab](https://www.cyberlab.at/kontakt/index.html),
  [COLOP Austria](https://www.colop.com/de_eur/kontakt),
  [Trodat Österreich](https://www.trodat.net/at/de/kontakt)

The two Planner suites passed with 27 tests, and the full website suite
passed with 173. The Next/Serwist build and its Planner cache entries passed.
Chrome checks at 1,440, 390 and 320 pixels covered navigation, keyboard use,
bookmark backup and restore, saved plans, filters, and CSV and ICS downloads.

## Desktop planning workflow — 23 November 2026

Overview combines the old Overview and Start Here entry points. It brings
together the main planning tools, outreach and delivery totals, and upcoming
photography events. Existing Start Here links open this view.

The calendar has a Weekends toggle that works with date, location, search and
topic filters. It matches a continuous event that overlaps a Saturday or Sunday.
A series matches on an explicitly published session date, or on its stated start
when individual dates are unavailable. Month view shows the matching weekend
dates. Calendar exports carry the original published schedules of the selected
events. Existing Weekend Picks links open the calendar with Weekends selected.

In Organisers & contacts, Add organiser saves a personal bookmark with a name
and optional category, location, website, email and notes. In a shoot's details,
Linked organisers lets you attach a saved bookmark or create and link one in
the same step. A link created through Competition photography is also
available in the full calendar. The organiser card lists linked shoots.

Personal organiser records and links are saved in the browser and included in
Planner backups. Edits preserve the bookmark identity. Deleting a personal
bookmark removes its links from all shoots.

The desktop view uses the whole Planner frame. Overview places the planning
tools and upcoming shoots side by side. Wide screens fit more event cards or
organiser cards per row, and calendar list rows put their Details action on the
right. Open shoots place event information and planning controls side by side.
Desktop navigation stays in view while the calendar scrolls.

The 31 Planner tests, all 177 website tests and the local Next/Serwist build
passed. Chrome checks at 1,440, 1,920 and 2,560 pixels covered the overview and
legacy links, weekend filtering, and creating, editing and linking organisers.
An exported backup restored a personal organiser and its shoot link in a clean
browser context.

## Shoot requirements — 23 November 2026

Open a shoot in Competition photography or the full calendar to set its
accreditation deadline and record the agreed photo usage permissions, credit
requirements and delivery commitments. The deadline uses a date picker. The
other fields accept the organiser's wording, including multiple lines.

The same entries appear in both views, where they follow the existing event ID.
They save in the browser as you edit and are included in the Planner backup.
The requirements sit in two columns inside an expanded shoot on a wide desktop.

The 33 Planner tests, all 179 website tests and the local production build
passed. Chrome at 1,440, 1,920 and 2,560 pixels checked cross-view editing,
reloads and the desktop layout. A backup restored all four fields in a clean
browser context.

## Expanded Calendar event details

Open a Calendar event to find **Contacts & outreach**, **Shoot requirements**
and **Plan & notes** side by side on desktop. Contacts brings together event
contacts, linked organisers, your saved email and pitch follow-up. Shoot
requirements keeps the four photography fields with the access guidance.
Plan & notes holds event status, photo delivery, notes and any portfolio idea.

The venue and official links sit above the panels. Event information and
source evidence are grouped below. The panels stack where the expanded event
has less room.

The 37 Planner and competition tests, all 183 website tests, the production
build and the offline check passed. Desktop Chrome verified the three panels
at 1,440, 1,920 and 2,560 pixels. A version 4 backup restored saved trip and
shoot data. Edits survived switching Calendar views, reloading and importing
again, and the JSON backup, CSV and ICS downloads matched byte for byte.

## Directory reconciliation — 23 November 2026

Gym Directory still lists 48 distinct places around Vienna and Bratislava.
The das flash row uses the same venue record as its existing organiser
bookmark. Open **Organiser & events** from the row to find the address,
venue links and the community-night photography lead. Separate facilities stay
searchable even where the operator uses one website for several branches.
[das flash venue](https://www.dasflash.at/),
[Alpenverein facility directory](https://www.alpenverein.at/portal/wGlobal/content/finder/kletteranlagenListe.php)

Portfolio Leads now contains 27 standalone ideas. Sixteen entries linked to
existing records were consolidated. The calendar carries the photography
guidance beside each dated shoot. The das flash bookmark carries the
community-night story.

| Original leads | Where the guidance appears |
| --- | --- |
| Kletterkombi, Halloween Team Spirit and autumn Bärenrallye | Calendar IDs 15, 43 and 41 |
| Two St. Pölten Monthly Challenge leads | Calendar IDs 35 and 105. The original 16 November mention appears as an organiser-archive check. |
| Three La Sportiva test-station leads | Calendar ID 42 |
| Two FLINTA* leads | Calendar ID 108 |
| Four Young Alpinists course leads | Calendar IDs 2882, 2889, 2890 and 2891 |
| Peilstein youth climbing week | Calendar ID 1844 |
| das flash community nights | Organisers & contacts, das flash |

The organiser’s Plombergstein dates, 14–18 August 2027, are shown by the
existing calendar event. The FLINTA* and La Sportiva entries use their
published session or tour pages.
[Young Alpinists programme](https://www.alpenverein.at/jungealpinisten/youngsters/index.php),
[Monthly Challenge](https://boulderbar.net/events/monthly-challenge-2026/),
[FLINTA* Session](https://boulderbar.net/events/flinta-session-2026/),
[La Sportiva test stations](https://boulderbar.net/events/la-sportiva-climb-world-tour-teststationen/)

On desktop, both directories use a full-width table with a fixed header.
Search handles accents and matches multiple words in any order. **See
calendar shoots** opens the calendar with the portfolio-ideas filter active.
Event dates, event IDs, source keys and saved pitch identities remain the same.

The 35 Planner tests, all 181 website tests and the local production build
passed. Chrome at 1,440, 1,920 and 2,560 pixels checked the desktop tables,
search, the calendar shortcut, the das flash bookmark and original pitch keys.

## Calendar renderer consolidation

The Planner uses one Calendar renderer for List, Cards and Month, with one
Month grid and shared date filtering, CSV export and ICS export. Desktop
layout, event IDs, source keys and the backup format are preserved.

The 36 Planner tests, all 182 website tests, the production build and the
PWA content check passed. Desktop Chrome at 1,440, 1,920 and 2,560 pixels
matched the existing layout and navigation. A version 4 backup restored
shoot requirements, organiser links, notes and a personal event. The JSON
backup, filtered CSV and ICS downloads matched byte for byte.

## Desktop Calendar filters and event list

Search, Location and Dates are the main filters. Location groups areas,
Austrian provinces and individual countries in one picker. Photography,
Competitions, Gear & brands and Weekends share a row with **More filters**.
The expanded controls are grouped by event, organiser and planning, and
the button shows how many extra filters are active.

Desktop List view aligns dates, event names and locations under column
headings that stay visible while scrolling. Click an event row or press
Enter or Space to open its details and saved planning fields.

The 37 Planner and competition tests and all 183 website tests passed.
Chrome checks at 1,440, 1,920 and 2,560 pixels covered keyboard expansion,
location choices, filtering, pagination, Cards, Month and Weekend Picks.
The default view at 1,440 × 900 displays six complete rows before scrolling,
compared with two previously. A version 4 backup restored saved filters,
a named trip, shoot details, an organiser link and a personal event. The
JSON backup, filtered CSV and ICS downloads matched byte for byte.

## Desktop Cards and Month views

Cards put the date, event type, name and venue in a compact preview.
Click the card or press Enter or Space to open its details, notes and
shoot requirements.

On desktop, Month places the calendar grid beside the agenda. Day counts
include ongoing events, while the previews highlight event starts and
published course sessions. Select a day to see its agenda. A published
session shows its date and ongoing events carry a label. **Show whole
month** returns to the month agenda. The arrow keys move between days.

The 37 Planner and competition tests, all 183 website tests, the
production build and the offline content check passed. Chrome checks at
1,440, 1,920 and 2,560 pixels matched the previous date counts and event
IDs and exercised keyboard expansion and Month navigation. At 1,440 × 900,
nine full cards and all five December calendar weeks fit before scrolling.

A version 4 backup restored a trip, a personal event, the selected Month
date, shoot requirements and an organiser link. A note edited in Month
appeared in Cards and List and survived reload and re-import. JSON, CSV
and ICS downloads matched the previous Planner byte for byte.
