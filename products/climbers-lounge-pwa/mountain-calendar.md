# Austria mountain calendar

Product scope: `climbers-lounge-pwa`. Research snapshot: 14–15 October 2026.

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

- 3,185 listings: 2,611 Austria, 128 foreign or spanning countries, 446 whose
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
