import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext, Script } from "node:vm";
import { describe, expect, it } from "vitest";

type PortfolioGuide = { events: number[]; title: string; format: string };
type DirectoryCell = { v: string; u?: string | null; pitch?: string | null };
type Event = {
  portfolioGuide?: PortfolioGuide;
  n: number; ev: string; s: string | null; e?: string | null;
  co: string; state?: string; states: string[]; city: string;
  venue?: string; u: string; tier: string; audience: string;
  organiserGroup: string; bookingCode?: string; sourceKey?: string;
  scheduleType: string; sessionDates?: string[]; time?: string;
  dateStatus: string; checked?: string; disciplines: string[]; topics: string[];
  contacts: { email?: string; source?: string }[];
  sources: { url: string }[];
};
type Filter = Record<string, string | boolean>;
type Organiser = { id: string; name: string };
type Domain = {
  vmOrganiserRecords: (state: Record<string, unknown>, builtIns: Organiser[]) => Organiser[];
  vmOrganiserLinkKey: (n: number, id: string) => string;
  vmLinkedOrganiserIds: (n: number, state: Record<string, unknown>, records: Organiser[]) => string[];
  vmOrganiserEventNumbers: (id: string, state: Record<string, unknown>) => number[];
  vmMatches: (event: Event, filter: Filter, now: string) => boolean;
  vmOnDay: (event: Event, day: string) => boolean;
  vmInMonth: (event: Event, first: string, last: string) => boolean;
  vmICS: (events: Event[], timestamp: string) => string;
  vmUncertain: (event: Event) => boolean;
  vmValidDate: (date: string) => boolean;
  vmSafeURL: (url: string) => string | null;
  vmCSVCell: (text: string) => string;
  vmCleanState: (state: unknown) => Record<string, unknown>;
};
const html = readFileSync(resolve(process.cwd(), "public/explore-app/planner-content.html"), "utf8");
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const data = JSON.parse(scripts.find(s => s[1].includes("application/json"))![2]) as {
  cal: Event[];
  g: Record<string, { rows: DirectoryCell[][] }>;
  portfolioGuides: PortfolioGuide[];
  bookmarkVenues: Record<string, { address: string; guide: { title: string } }>;
  programmes: { id: string; s?: string; u: string }[];
  coverage: { totalListings: number; byCountry: Record<string, number> };
};
const code = scripts.find(s => !s[1].includes("application/json"))![2];
function section(start: string, end: string) {
  return code.split(start)[1].split(end)[0];
}
const domain = runInNewContext(
  section("/* VM_DOMAIN_START */", "/* VM_DOMAIN_END */") + "\n" +
  section("/* VM_EXPANDED_DOMAIN_START */", "/* VM_EXPANDED_DOMAIN_END */") +
  "\n" + section("/* VM_ORGANISER_DOMAIN_START */", "/* VM_ORGANISER_DOMAIN_END */") +
  ";({vmMatches,vmOnDay,vmInMonth,vmICS,vmUncertain,vmValidDate,vmSafeURL,vmCSVCell,vmCleanState," +
  "vmOrganiserRecords,vmOrganiserLinkKey,vmLinkedOrganiserIds,vmOrganiserEventNumbers})",
  { Date, URL, TextEncoder },
) as Domain;
const now = "2026-10-15";
const events = data.cal;
function byNumber(n: number) { return events.find(c => c.n === n)!; }

describe("embedded mountain calendar", () => {
  it("preserves previous event IDs and distinct new source identities", () => {
    expect(events.length).toBeGreaterThan(3000);
    expect(new Set(events.map(c => c.n)).size).toBe(events.length);
    for (let n = 1; n <= 122; n++) expect(byNumber(n), `event ${n}`).toBeDefined();
    const keys = events.flatMap(c => c.sourceKey ? [c.sourceKey] : []);
    expect(new Set(keys).size).toBe(keys.length);
    expect(data.coverage.totalListings).toBe(events.length);
  });

  it("keeps each venue searchable while sharing the das flash record", () => {
    const venues = data.g["Gym Directory"].rows;
    expect(venues.filter(row => row[0].v === "das flash")).toHaveLength(0);
    expect(data.bookmarkVenues["das-flash"]).toMatchObject({
      address: "Adolf-Schmidl-Gasse 4, 1200 Wien",
      guide: { title: "das flash community nights" },
    });
    expect(venues.length + Object.keys(data.bookmarkVenues).length).toBe(48);
    const branchNames = ["Boulderbar Hannovergasse", "Boulderbar Wienerberg", "Boulderbar Hauptbahnhof", "Boulderbar Seestadt"];
    const branches = venues.filter(row => branchNames.includes(row[0].v));
    expect(branches).toHaveLength(4);
    expect(new Set(branches.map(row => row[3].v)).size).toBe(4);
    expect(new Set(branches.map(row => row[7].u)).size).toBe(1);
  });

  it("keeps one portfolio guide per matched event and preserves standalone leads", () => {
    const standalone = data.g["Portfolio Leads"].rows;
    expect(standalone).toHaveLength(27);
    expect(standalone.filter(row => row[0].v === "Route setters at work").map(row => row[1].v))
      .toEqual(["Kletterhalle Wien or Blockfabrik", "K1 Dornbirn"]);
    expect(standalone.some(row => row[8]?.pitch)).toBe(false);

    const ids = data.portfolioGuides.flatMap(guide => guide.events).sort((a, b) => a - b);
    expect(ids).toEqual([15, 35, 41, 42, 43, 105, 108, 1844, 2882, 2889, 2890, 2891]);
    const guides = new Map(data.portfolioGuides.flatMap(guide => guide.events.map(id => [id, guide] as const)));
    const linked = events.map(event => ({ ...event, portfolioGuide: guides.get(event.n) }));
    const matches = linked.filter(event => domain.vmMatches(event, { portfolio: true, scope: "all", period: "all" }, now));
    expect(matches.map(event => event.n).sort((a, b) => a - b)).toEqual(ids);
    expect(linked.filter(event => domain.vmMatches(event, {
      portfolio: true, q: "gear-use independent", from: "2026-10-27", to: "2026-11-06",
    }, now)).map(event => event.n)).toEqual([42]);
  });

  it("keeps country scopes disjoint and excludes unknown destinations from Austria", () => {
    const at = events.filter(c => domain.vmMatches(c, { scope: "AT", period: "all" }, now));
    const other = events.filter(c => domain.vmMatches(c, { scope: "other", period: "all" }, now));
    const unknown = events.filter(c => domain.vmMatches(c, { scope: "unknown", period: "all" }, now));
    expect(at.length).toBe(data.coverage.byCountry.AT);
    expect(at.every(c => c.co === "AT")).toBe(true);
    expect(other.every(c => !["AT", "UNKNOWN"].includes(c.co))).toBe(true);
    expect(unknown.every(c => c.co === "UNKNOWN")).toBe(true);
    expect(at.length + other.length + unknown.length).toBe(events.length);
  });

  it("combines province, organiser, topic and event-type filters", () => {
    const rows = events.filter(c => domain.vmMatches(c, {
      scope: "AT", period: "upcoming", state: "Tirol", group: "brand",
      topic: "avalanche", kind: "course",
    }, now));
    expect(rows.length).toBeGreaterThan(24);
    expect(rows.every(c => c.states.includes("Tirol") && c.organiserGroup === "brand" && c.topics.includes("avalanche"))).toBe(true);
  });

  it("retains the original Blockfabrik enquiry route", () => {
    const c = byNumber(29);
    expect(c.s).toBe("2026-10-17");
    expect(c.venue).toBe("Blockfabrik");
    expect(c.contacts.some(x => x.email === "office@blockfabrik.at")).toBe(true);
    expect(domain.vmMatches(c, { scope: "AT", q: "office@blockfabrik.at" }, now)).toBe(true);
  });

  it("finds accented photography listings by multiple words in any order", () => {
    const workshop = byNumber(9107);
    const filters = { scope: "AT", state: "Steiermark", topic: "photography", q: "gesause fotowanderung" };
    expect(domain.vmMatches(workshop, filters, now)).toBe(true);
    expect(domain.vmMatches(workshop, { ...filters, q: "gesause festival" }, now)).toBe(false);
    expect(domain.vmMatches(workshop, { ...filters, state: "Wien" }, now)).toBe(false);
  });

  it("distinguishes course cohorts with different official booking codes", () => {
    const groups = events.filter(c => c.organiserGroup === "alpenverein" && c.ev === "Ferienkurs Herbst" && c.s === "2026-10-26");
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(new Set(groups.map(c => c.bookingCode)).size).toBe(groups.length);
  });

  it("retains distinct published appointment times without duplicate Naturfreunde entries", () => {
    const groups = events.filter(c => c.u === "https://niederoesterreich.naturfreunde.at/events/angebot/gratis-schnupperklettern/" && c.s === "2026-10-26");
    expect(groups.map(c => c.time).sort()).toEqual(["17:00 – 18:00", "18:00 – 19:00"]);
    const keys = events.filter(c => c.organiserGroup === "naturfreunde").map(c => [c.u, c.s, c.e, c.time].join("|"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not treat a children's age or a photo-credit location as event metadata", () => {
    expect(byNumber(2908).state).toBe("Vorarlberg");
    expect(byNumber(2908).topics).not.toContain("anniversary");
    expect(byNumber(2915).disciplines).toContain("rope");
    expect(byNumber(2915).topics).not.toContain("instructor");
    expect(events.every(c => c.city.length <= 180)).toBe(true);
  });

  it("places long course series only on the start or explicit session dates", () => {
    const series = byNumber(1021);
    expect(series.scheduleType).toBe("series");
    expect(domain.vmOnDay(series, series.s!)).toBe(true);
    expect(domain.vmOnDay(series, "2026-10-20")).toBe(false);
    expect(domain.vmInMonth(series, "2026-11-01", "2026-11-30")).toBe(false);
    const explicit = events.find(c => c.sessionDates?.length === 2)!;
    expect(domain.vmOnDay(explicit, explicit.sessionDates![1])).toBe(true);
    expect(domain.vmOnDay(explicit, "2026-12-31")).toBe(false);
  });

  it("keeps continuous multi-day events on their inclusive final date", () => {
    const festival = events.find(c => c.ev.includes("Eis Total"))!;
    expect(domain.vmOnDay(festival, "2027-01-24")).toBe(true);
    expect(domain.vmOnDay(festival, "2027-01-25")).toBe(false);
    expect(domain.vmMatches(festival, { from: "2027-01-24", to: "2027-01-24", setting: "outdoor" }, now)).toBe(true);
  });

  it("matches a continuous event when the chosen date window includes a weekend", () => {
    const event = { ...byNumber(9107), scheduleType: "continuous", s: "2027-01-22", e: "2027-01-25" };
    const filter = { scope: "AT", period: "upcoming", weekends: true };
    expect(domain.vmMatches(event, { ...filter, to: "2027-01-22" }, now)).toBe(false);
    expect(domain.vmMatches(event, { ...filter, from: "2027-01-23", to: "2027-01-23" }, now)).toBe(true);
    expect(domain.vmMatches(event, { ...filter, from: "2027-01-24", to: "2027-01-24" }, now)).toBe(true);
    expect(domain.vmMatches(event, filter, "2027-01-25")).toBe(false);
  });

  it("uses only published series dates for the weekend filter", () => {
    const series = { ...byNumber(9107), scheduleType: "series", s: "2027-01-22", e: "2027-01-31" };
    const filter = { scope: "AT", period: "upcoming", weekends: true };
    expect(domain.vmMatches(series, filter, now)).toBe(false);
    const sessions = { ...series, sessionDates: ["2027-01-22", "2027-01-24", "2027-01-26"] };
    expect(domain.vmMatches(sessions, filter, now)).toBe(true);
    expect(domain.vmMatches(sessions, { ...filter, from: "2027-01-25" }, now)).toBe(false);
    expect(domain.vmMatches(sessions, filter, "2027-01-25")).toBe(false);
    expect(domain.vmMatches({ ...series, s: "2027-01-23" }, filter, now)).toBe(true);
  });

  it("loads personal organiser bookmarks from backup without allowing unsafe links", () => {
    const id = "personal-" + "a".repeat(32);
    const backup = domain.vmCleanState({
      ["photo:organiser:" + id]: {
        name: "  Print studio  ", group: "unknown", url: "javascript:void(0)", email: "studio@example.org",
      },
      "photo:organiser:invalid": { name: "Ignore" },
    });
    const records = domain.vmOrganiserRecords(backup, []);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id, name: "Print studio", group: "other", url: null, email: "studio@example.org" });
    expect(domain.vmOrganiserRecords({}, [])).toEqual([]);
  });

  it("uses stable event and organiser IDs for distinct links across backup and edits", () => {
    const id = "personal-" + "a".repeat(32);
    const second = "personal-" + "b".repeat(32);
    const booking = {
      ["photo:organiser:" + id]: { name: "Edited studio" },
      ["photo:organiser:" + second]: { name: "Climbing club" },
      [domain.vmOrganiserLinkKey(9107, id)]: true,
      [domain.vmOrganiserLinkKey(9140, id)]: true,
      [domain.vmOrganiserLinkKey(9107, second)]: true,
      ["photo:organiser-link:bad:" + id]: true,
    };
    const state = domain.vmCleanState(JSON.parse(JSON.stringify(booking)));
    const records = domain.vmOrganiserRecords(state, []);
    expect(domain.vmLinkedOrganiserIds(9107, state, records)).toEqual([second, id]);
    expect(domain.vmLinkedOrganiserIds(9140, state, records)).toEqual([id]);
    expect(domain.vmOrganiserEventNumbers(id, state)).toEqual([9107, 9140]);
  });

  it("binds each shoot's four requirements to separate Planner backup keys", () => {
    const fields: { key: string; label: string; kind: string }[] = [];
    const render = runInNewContext(
      "function vmShootRequirements" + section("function vmShootRequirements", "function vmSelect") + "\nvmShootRequirements",
      {
        h: () => null,
        vmLocalField: (key: string, label: string, kind: string) => fields.push({ key, label, kind }),
      },
    ) as (id: number) => void;
    render(9107);
    render(9140);
    expect(fields).toEqual([9107, 9140].flatMap(id => [
      { key: "photo:" + id + ":accreditation-deadline", label: "Accreditation deadline", kind: "date" },
      { key: "photo:" + id + ":usage-permissions", label: "Photo usage permissions", kind: "textarea" },
      { key: "photo:" + id + ":credit-requirements", label: "Credit requirements", kind: "textarea" },
      { key: "photo:" + id + ":delivery-commitments", label: "Delivery commitments", kind: "textarea" },
    ]));
    const state = Object.fromEntries(fields.map(({ key }, i) => [key, "requirement " + i]));
    expect(domain.vmCleanState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("loads saved shoot notes as the field value without adding them to the label", () => {
    const key = "photo:9107:usage-permissions";
    const note = "Organiser recap only.\nAsk before paid use.";
    const createField = runInNewContext(
      "function vmLocalField" + section("function vmLocalField", "function vmShootRequirements") + "\nvmLocalField",
      {
        S: { [key]: note },
        h: (_tag: string, _attributes: unknown, ...children: unknown[]) =>
          ({ children, value: "", addEventListener: () => {} }),
        vmField: (label: string, input: unknown) => ({ label, input }),
      },
    ) as (key: string, label: string, kind: string) => unknown;
    expect(createField(key, "Photo usage permissions", "textarea"))
      .toMatchObject({ label: "Photo usage permissions", input: { value: note, children: [] } });
  });

  it("excludes unsettled dates from checked-date filters and ICS", () => {
    const unsettled = events.filter(c => domain.vmUncertain(c));
    expect(unsettled.length).toBeGreaterThan(5);
    for (const c of unsettled) expect(domain.vmMatches(c, { verified: true }, now)).toBe(false);
    expect(domain.vmICS(unsettled, "20261015T120000Z")).not.toContain("BEGIN:VEVENT");
    expect(byNumber(66).s).toBeNull();
    expect(byNumber(73).dateStatus).toBe("Date conflict");
  });

  it("exports all-day series starts, inclusive festival ends and valid folded UTF-8 ICS", () => {
    const festival = events.find(c => c.ev.includes("Eis Total"))!;
    const ics = domain.vmICS([festival, byNumber(1021)], "20261015T120000Z");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTEND;VALUE=DATE:20270125");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
    expect(ics).toContain("DTEND;VALUE=DATE:20261016");
    expect(ics).not.toContain("RRULE");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
  });

  it("keeps undated anniversary announcements outside the dated catalogue", () => {
    for (const id of ["kasseler100", "kalkalpen30", "nachtderberge27"]) {
      const p = data.programmes.find(p => p.id === id)!;
      expect(p).toBeDefined();
      expect(p.s).toBeUndefined();
      expect(events.some(c => c.u === p.u)).toBe(false);
    }
    expect(byNumber(109).e).toBe("2027-06-11");
    expect(events.find(c => c.sourceKey === "datahub:3892")!.s).toBe("2027-06-12");
  });

  it("validates dates, contact routes and safe source links", () => {
    for (const c of events) {
      if (c.s) expect(domain.vmValidDate(c.s), c.ev).toBe(true);
      if (c.e) { expect(domain.vmValidDate(c.e), c.ev).toBe(true); expect(c.e >= c.s!).toBe(true); }
      expect(c.contacts.some(x => x.email || domain.vmSafeURL(x.source || "")), c.ev).toBe(true);
      for (const s of c.sources) expect(domain.vmSafeURL(s.url), c.ev).not.toBeNull();
    }
    expect(domain.vmValidDate("2027-02-29")).toBe(false);
    expect(domain.vmValidDate("2028-02-29")).toBe(true);
  });

  it("protects CSV fields, backup object keys and source URL protocols", () => {
    expect(domain.vmCSVCell("=HYPERLINK()")).toBe('"\'=HYPERLINK()"');
    expect(domain.vmSafeURL("javascript:alert(1)")).toBeNull();
    expect(() => domain.vmCleanState([])).toThrow();
    const state = domain.vmCleanState(JSON.parse('{"__proto__":{"polluted":true},"cal:29:status":"Pitched"}'));
    expect(Object.hasOwn(state, "__proto__")).toBe(false);
    expect(state["cal:29:status"]).toBe("Pitched");
  });

  it("ships valid self-contained application code and the stable storage key", () => {
    expect(scripts).toHaveLength(2);
    expect(html).not.toContain("<script src=");
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/);
    expect(code).toContain("climbplanner.v1");
    expect(() => new Script(code)).not.toThrow();
  });
});
