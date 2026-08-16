import type { FieldOpsPlan, FieldOpsStop } from "./types";

function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function stop(id: string, region: string, focus: string, notes: string[] = []): FieldOpsStop {
  return {
    id,
    region,
    focus,
    mapsUrl: mapsSearch(`${region}, Lower Austria, Austria`),
    exploreUrl: "/explore-app?open=crag-locator&intro=skip",
    notes,
  };
}

export const FIELD_OPS_PLAN: FieldOpsPlan = {
  version: 1,
  title: "Vertical Moment — Three-Weekend Field Ops",
  updatedAt: "2026-08-16",
  liveChecks: [
    { label: "Austro Control Dronespace", url: "https://utm.dronespace.at/avm/" },
    { label: "GeoSphere Austria weather", url: "https://geosphere.at/en/maps/weather-forecast" },
    { label: "ÖAMTC route planner", url: "https://www.oeamtc.at/routenplaner/" },
    { label: "Austria emergency information", url: "https://www.oesterreich.gv.at/en/themen/notfaelle_unfaelle_und_kriminalitaet/notrufnummern.html" },
  ],
  captureItems: [
    { id: "parking", label: "Parking waypoint + signs", tier: "required", description: "Record exact parking position, restrictions and trailhead evidence." },
    { id: "gps", label: "Wall-centre GPS", tier: "required", description: "Capture a measured field position. Never replace verified coordinates with a guess." },
    { id: "approach", label: "Approach + decision points", tier: "required", description: "Record junctions, approach time, hazards, path surface and obvious decision points." },
    { id: "access", label: "Access / closure evidence", tier: "required", description: "Photograph current signs and log uncertainty instead of assuming access." },
    { id: "overview", label: "Full wall / environment", tier: "required", description: "Wide context plus an unobstructed wall overview." },
    { id: "coverage", label: "Left · centre · right coverage", tier: "required", description: "Systematic visual coverage for later QA and spatial reference." },
    { id: "route-reference", label: "Route-reference photos", tier: "required", description: "Reference imagery only. Agents must not infer or draw route lines from photographs." },
    { id: "voice", label: "60-second exit voice memo", tier: "required", description: "State what exists, what is missing, access confidence and return priority." },
    { id: "infrastructure", label: "Infrastructure / local context", tier: "recommended", description: "Parking, transport, village sign, water/toilet, hut/restaurant exterior and recognizable context." },
    { id: "drone", label: "Drone spatial pass", tier: "recommended", description: "Only after current airspace plus site/nature/property GO checks." },
    { id: "measurements", label: "Reference measurements", tier: "recommended", description: "Capture known distances where safe and useful for later 3D validation." },
    { id: "video", label: "Short motion clips", tier: "recommended", description: "Useful movement/context clips without sacrificing required evidence." },
    { id: "360", label: "360 capture", tier: "extra", description: "Capture only when it adds product value and the schedule is healthy." },
    { id: "photogrammetry", label: "Photogrammetry set", tier: "extra", description: "Do only for a selected production target with sufficient overlap and time." },
  ],
  relayItems: [
    { id: "master-a", label: "MASTER A", description: "Primary lossless ingest completed." },
    { id: "backup-b", label: "BACKUP B", description: "Second verified copy exists before formatting cards." },
    { id: "inventory", label: "Inventory + checksums", description: "File manifest and SHA-256 inventory generated." },
    { id: "proxies", label: "Proxies", description: "Lightweight previews/contact sheets prepared for agent work." },
    { id: "packet", label: "Agent packet", description: "GPX, audio, manifests, proxies and field notes packaged." },
    { id: "sync", label: "Sync", description: "Small packet uploaded first; masters may continue afterward." },
    { id: "chatgpt", label: "ChatGPT QA", description: "Coverage audit / transcript / metadata pass started." },
    { id: "codex", label: "Codex", description: "Only bounded repository/data validation work started." },
    { id: "notion", label: "Notion draft", description: "Operating-truth updates prepared for review." },
    { id: "review", label: "Owner review", description: "Anything requiring Filip's decision is collected in one queue." },
  ],
  noteCategories: ["Photo", "GPS", "Voice", "Access", "Parking", "Drone", "Infrastructure", "Contributor bug", "Other"],
  hardRules: [
    "Never invent route lines, sectors, access permission, GPS coordinates or asset provenance.",
    "Google Maps is navigation support, never proof of legal parking or access.",
    "No drone flight without current airspace plus site/nature/property GO.",
    "Do not upload RAW masters into Field Ops. Keep masters in the two-copy laptop/home-PC pipeline.",
    "Field Ops stores operational evidence and review state; canonical published climbing facts remain separate.",
    "No automatic merge, deployment or publication. Owner review remains the release gate.",
  ],
  dailyRoutine: [
    "05:15–05:45 breakfast, weather, road and drone live checks.",
    "At each stop: parking → GPX/approach → access evidence → wall coverage → optional spatial capture → context → exit memo.",
    "12:30–13:30 packed lunch plus battery/card reset and midday agent relay when practical.",
    "Dinner after useful shooting light; restaurant interiors/food only with permission.",
    "20:30–22:15 two-copy ingest, checksums, proxies, packet, sync and nightly agent QA.",
    "22:30 sleep target. Do not spend acquisition weekends doing final editing.",
  ],
  weekends: [
    {
      id: "weekend-1",
      label: "Weekend 1",
      cluster: "Wienerwald / Baden",
      successCondition: "Touch all 8 regions with field evidence; deep-capture only selected high-value anchors; leave a return queue.",
      days: [
        {
          id: "w1-friday",
          label: "Friday",
          routeLabel: "Vienna → Kaltenleutgebner Tal → Mödling → Baden",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Vienna%2C+Austria&destination=Baden+bei+Wien%2C+Austria&travelmode=driving&waypoints=Kaltenleutgebner%20Tal%2C%20Austria%7CM%C3%B6dling%2C%20Austria%7CBaden%20bei%20Wien%2C%20Austria",
          stops: [
            stop("kaltenleutgebner-tal", "Kaltenleutgebner Tal", "Representative legal anchor + access/infrastructure evidence"),
            stop("modling", "Mödling", "Dense canonical anchor + city/transport context"),
            stop("baden", "Baden", "Representative anchor + town/infrastructure imagery"),
          ],
          foodPlan: "Packed field food until useful light is finished; hot dinner in Baden. Photograph public exterior/context before eating.",
          sleepPlan: "Use one Baden/Alland base for the weekend where possible; avoid changing accommodation every night.",
          redFlags: ["Do not spend Friday chasing complete region coverage; establish evidence and move."],
        },
        {
          id: "w1-saturday",
          label: "Saturday",
          routeLabel: "Baden → Helenental → Lindkogel → Alland → Baden/Alland base",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Baden+bei+Wien%2C+Austria&destination=Baden+bei+Wien%2C+Austria&travelmode=driving&waypoints=Helenental%2C%20Baden%2C%20Austria%7CHoher%20Lindkogel%2C%20Austria%7CAlland%2C%20Austria",
          stops: [
            stop("helenental", "Helenental", "High-value deep field audit", ["Verify exact crag/core-zone/parking status before committing to a wall."]),
            stop("lindkogel", "Lindkogel", "Legal-access anchor selection + context", ["Do not use Merkenstein as a default target without current legal access confirmation."]),
            stop("alland", "Alland", "Regional recon + infrastructure / context"),
          ],
          foodPlan: "Breakfast before departure; second breakfast on the move; packed lunch during battery/card reset; dinner after golden-hour context.",
          sleepPlan: "Same Baden/Alland base as Friday where practical.",
          redFlags: ["Helenental access/parking evidence is a deliverable, not an afterthought.", "Lindkogel anchor must be currently legal/appropriate."],
        },
        {
          id: "w1-sunday",
          label: "Sunday",
          routeLabel: "Baden/Alland → Arnstein → Peilstein → Vienna",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Baden+bei+Wien%2C+Austria&destination=Vienna%2C+Austria&travelmode=driving&waypoints=Arnstein%2C%20Alland%2C%20Austria%7CPeilstein%2C%20Neuhaus%2C%20Austria",
          stops: [
            stop("arnstein", "Arnstein", "Closeout-oriented deep capture", ["Use existing source assets to target missing provenance/master-path evidence rather than reshooting blindly."]),
            stop("peilstein", "Peilstein", "Deep capture + recognizable landscape/hut context"),
          ],
          foodPlan: "Early breakfast; packed lunch; use Peilstein context/hut only if it does not compromise capture timing.",
          sleepPlan: "Return Vienna after final ingest-ready stop; do not postpone the two-copy backup until Monday.",
          redFlags: ["Arnstein should resolve known gaps rather than create duplicate media."],
        },
      ],
    },
    {
      id: "weekend-2",
      label: "Weekend 2",
      cluster: "Hohe Wand / Bucklige Welt",
      successCondition: "Capture six canonical regions, with Hohe Wand as the principal production-quality evidence day.",
      days: [
        {
          id: "w2-friday",
          label: "Friday",
          routeLabel: "Vienna → Fischauer Vorberge → Wöllersdorf Hart → Hohe Wand",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Vienna%2C+Austria&destination=Naturpark+Hohe+Wand%2C+Austria&travelmode=driving&waypoints=Bad%20Fischau-Brunn%2C%20Austria%7CW%C3%B6llersdorf-Steinabr%C3%BCckl%2C%20Austria%7CNaturpark%20Hohe%20Wand%2C%20Austria",
          stops: [
            stop("fischauer-vorberge", "Fischauer Vorberge", "Representative wall + access/signage + source-batch mapping"),
            stop("wollersdorf-hart", "Wöllersdorf Hart", "Compact regional evidence pass"),
          ],
          foodPlan: "Field food during the sweep; dinner after reaching the Hohe Wand base.",
          sleepPlan: "Legal Hohe Wand/base accommodation or designated camping only after current availability check.",
          redFlags: ["Do not burn production light at Fischauer Vorberge trying to cover every sub-area."],
        },
        {
          id: "w2-saturday",
          label: "Saturday",
          routeLabel: "Hohe Wand deep capture → Puchberg Grünbach → Hohe Wand/base",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Naturpark+Hohe+Wand%2C+Austria&destination=Naturpark+Hohe+Wand%2C+Austria&travelmode=driving&waypoints=Naturpark%20Hohe%20Wand%2C%20Austria%7CPuchberg%20am%20Schneeberg%2C%20Austria%7CGr%C3%BCnbach%20am%20Schneeberg%2C%20Austria",
          stops: [
            stop("hohe-wand", "Hohe Wand", "Primary deep-capture target", ["Choose the sourced hero route/sector before deep capture.", "No drone around the Skywalk; evaluate any other launch independently."]),
            stop("puchberg-grunbach", "Puchberg Grünbach", "Representative anchor + Schneeberg/local infrastructure context", ["Canonical placeholder-like records must not be resolved by guesswork."]),
          ],
          foodPlan: "Breakfast before first light; packed lunch at car while swapping batteries/cards; dinner after Puchberg context or back at base.",
          sleepPlan: "Second night at the same legal base where practical.",
          redFlags: ["Hohe Wand Skywalk is ground-camera context, not a drone target.", "Pilot activation remains owner-controlled."],
        },
        {
          id: "w2-sunday",
          label: "Sunday",
          routeLabel: "Hohe Wand/base → Neunkirchen → Bucklige Welt → Vienna",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Naturpark+Hohe+Wand%2C+Austria&destination=Vienna%2C+Austria&travelmode=driving&waypoints=Neunkirchen%2C%20Austria%7CScheiblingkirchen-Thernberg%2C%20Austria%7CSeebenstein%2C%20Austria",
          stops: [
            stop("neunkirchen", "Neunkirchen", "Recon-required regional evidence"),
            stop("bucklige-welt", "Bucklige Welt", "Data-rich/media-poor representative capture + local context"),
          ],
          foodPlan: "Early breakfast, packed lunch; optional local dinner only if ingest/return schedule remains healthy.",
          sleepPlan: "Return Vienna and complete two-copy verification before treating the weekend as closed.",
          redFlags: ["Bucklige Welt data conflict remains a reconciliation issue; field media must not silently resolve database counts."],
        },
      ],
    },
    {
      id: "weekend-3",
      label: "Weekend 3",
      cluster: "Piestingtal / Rax / Semmering",
      successCondition: "Capture the six remaining canonical regions with emphasis on mountain access evidence and uncertainty logging.",
      days: [
        {
          id: "w3-friday",
          label: "Friday",
          routeLabel: "Vienna → Piestingtal → Pernitz",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Vienna%2C+Austria&destination=Pernitz%2C+Austria&travelmode=driving&waypoints=Vordere%20Mandling%2C%20Austria%7CPernitz%2C%20Austria",
          stops: [
            stop("piestingtal", "Piestingtal", "Recon-required representative field pass"),
            stop("pernitz", "Pernitz", "Data-rich/media-poor anchor + town logistics"),
          ],
          foodPlan: "Field meal during transfer; photograph public town/infrastructure context before dinner in Pernitz.",
          sleepPlan: "Pernitz accommodation booked before departure; avoid late mountain repositioning after ingest.",
          redFlags: ["Use verified candidate selection; do not pick a wall solely because it is closest to the road."],
        },
        {
          id: "w3-saturday",
          label: "Saturday",
          routeLabel: "Pernitz → Hirschwände → Hocheck → Rax/Reichenau",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Pernitz%2C+Austria&destination=Rax-Seilbahn+Talstation%2C+Reichenau+an+der+Rax%2C+Austria&travelmode=driving&waypoints=Hirschw%C3%A4nde%2C%20Austria%7CHocheck%2C%20Furth%20an%20der%20Triesting%2C%20Austria%7CRax-Seilbahn+Talstation%2C+Reichenau+an+der+Rax%2C+Austria",
          stops: [
            stop("hirschwande", "Hirschwände", "Sector-structured spatial evidence pass"),
            stop("hocheck", "Hocheck", "Data-rich/media-poor deep recon", ["Budget substantially more approach time than for a roadside crag."]),
          ],
          foodPlan: "Mountain breakfast; carry full packed lunch and reserve water; dinner only after reaching the Rax/Reichenau base.",
          sleepPlan: "Legal Rax/Reichenau accommodation/camping confirmed in advance; ingest after arrival.",
          redFlags: ["Mountain weather can invalidate the schedule quickly.", "Do not plan food/water around an unverified hut opening."],
        },
        {
          id: "w3-sunday",
          label: "Sunday",
          routeLabel: "Rax/Reichenau → Höllental-Rax → Adlitzgraben → Vienna",
          routeUrl: "https://www.google.com/maps/dir/?api=1&origin=Rax-Seilbahn+Talstation%2C+Reichenau+an+der+Rax%2C+Austria&destination=Vienna%2C+Austria&travelmode=driving&waypoints=H%C3%B6llental%2C%20Reichenau%20an%20der%20Rax%2C%20Austria%7CAdlitzgraben%2C%20Breitenstein%2C%20Austria",
          stops: [
            stop("hollental-rax", "Höllental-Rax", "Access/spatial evidence while canonical/Notion mapping remains unresolved"),
            stop("adlitzgraben", "Adlitzgraben", "Access-documentation stop unless current open status is established", ["Treat signs and restrictions as first-class evidence."]),
          ],
          foodPlan: "Early breakfast; packed field food; return to Vienna after evidence capture rather than extending into uncertain access areas.",
          sleepPlan: "Return Vienna. Verify both copies and agent packet before weekend closeout.",
          redFlags: ["Höllental-Rax mapping remains unresolved.", "Adlitzgraben is recon/access documentation unless current permission/open status is established."],
        },
      ],
    },
  ],
};
