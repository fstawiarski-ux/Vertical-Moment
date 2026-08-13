"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import cragsData from "../data/crags.json";
import {
  downloadContributionArchive,
  readContributionDraft,
  safeArchiveName,
  storeEvidenceFile,
  writeContributionDraft,
  type LocalEvidenceFile,
} from "@/lib/contribution-local";

type Crag = { n: string; la: number; lo: number; r: string[]; db: boolean; routes: { n: string }[] };
type Coords = { lat: number; lon: number } | null;
type GpsStatus = "idle" | "locating" | "denied";
type SaveState = "loading" | "saving" | "saved" | "error";
type QuickReportDraft = {
  cragName: string;
  gps: Coords;
  routeTags: Record<string, boolean>;
  files: LocalEvidenceFile[];
  comment: string;
  parkingGps: Coords;
  parkingPhoto: LocalEvidenceFile | null;
  parkingCost: string;
  anchorCheck: "not_checked" | "looks_ok" | "needs_attention";
  anchorNotes: string;
  submitted: boolean;
};

const CRAGS = cragsData as Crag[];
const QUICK_REPORT_KEY = "quick-report:v1";

function emptyReport(initialCrag = ""): QuickReportDraft {
  return {
    cragName: initialCrag,
    gps: null,
    routeTags: {},
    files: [],
    comment: "",
    parkingGps: null,
    parkingPhoto: null,
    parkingCost: "",
    anchorCheck: "not_checked",
    anchorNotes: "",
    submitted: false,
  };
}

function EvidencePreview({ file }: { file: LocalEvidenceFile }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (file.kind !== "photo") return;
    const next = URL.createObjectURL(file.blob);
    setSrc(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" />;
  }
  return <div className="ic">{file.kind === "gpx" ? "GPX" : file.kind === "pdf" ? "PDF" : "FILE"}</div>;
}

export function FieldReport() {
  const params = useSearchParams();
  const initialCrag = params.get("crag") || "";
  const [report, setReport] = useState<QuickReportDraft>(() => emptyReport(initialCrag));
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [exporting, setExporting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [parkingGpsStatus, setParkingGpsStatus] = useState<GpsStatus>("idle");

  const crag = CRAGS.find((entry) => entry.n === report.cragName) || null;
  const matches = useMemo(() => {
    if (crag || !report.cragName.trim()) return [];
    const search = report.cragName.toLowerCase();
    return CRAGS.filter((entry) => entry.n.toLowerCase().includes(search)).slice(0, 8);
  }, [crag, report.cragName]);

  useEffect(() => {
    let active = true;
    void readContributionDraft<QuickReportDraft>(QUICK_REPORT_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        setReport({ ...emptyReport(initialCrag), ...stored, files: stored.files ?? [] });
      })
      .catch(() => {
        if (active) setSaveState("error");
      })
      .finally(() => {
        if (!active) return;
        setLoaded(true);
        setSaveState((state) => state === "error" ? state : "saved");
      });
    return () => { active = false; };
  }, [initialCrag]);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      void writeContributionDraft(QUICK_REPORT_KEY, report)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [loaded, report]);

  const patch = (value: Partial<QuickReportDraft>) => setReport((previous) => ({ ...previous, ...value }));

  function locate(field: "gps" | "parkingGps", setStatus: (value: GpsStatus) => void) {
    if (!("geolocation" in navigator)) { setStatus("denied"); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        patch({ [field]: { lat: position.coords.latitude, lon: position.coords.longitude } });
        setStatus("idle");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  }

  function addFiles(list: FileList, target: "routes" | "parking") {
    const items = [...list].map(storeEvidenceFile);
    if (target === "routes") patch({ files: [...report.files, ...items] });
    else if (items[0]) patch({ parkingPhoto: items[0] });
  }

  async function exportPackage() {
    setExporting(true);
    const evidence = [...report.files, ...(report.parkingPhoto ? [report.parkingPhoto] : [])];
    try {
      await downloadContributionArchive(
        `vertical-moment-field-report-${safeArchiveName(report.cragName || "unknown-crag")}-${new Date().toISOString().slice(0, 10)}.zip`,
        {
          format: "vertical-moment-contribution/v1",
          kind: "quick-field-report",
          exportedAt: new Date().toISOString(),
          location: { crag: report.cragName || null, gps: report.gps },
          routes: Object.keys(report.routeTags).filter((route) => report.routeTags[route]),
          comment: report.comment,
          parking: { gps: report.parkingGps, cost: report.parkingCost, photoId: report.parkingPhoto?.id ?? null },
          anchors: { observation: report.anchorCheck, notes: report.anchorNotes },
          files: evidence.map(({ blob: _blob, ...file }) => ({ ...file, role: file.id === report.parkingPhoto?.id ? "parking" : "field-evidence" })),
        },
        evidence,
      );
    } finally {
      setExporting(false);
    }
  }

  if (!loaded) return <div className="card done"><p className="muted">Opening your field draft...</p></div>;

  if (report.submitted) {
    return (
      <div className="card done">
        <div className="eyebrow">Ready on this device</div>
        <h1>Your report is prepared.</h1>
        <p className="muted">
          {report.cragName ? `${report.cragName} - ` : ""}nothing has uploaded or published. Export the ZIP package to inspect, move or share it.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-terra" onClick={() => void exportPackage()} disabled={exporting}>{exporting ? "Building package..." : "Export review package"}</button>
          <button className="btn btn-ghost" onClick={() => patch({ submitted: false })}>Continue editing</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-layout">
      <aside className="card cheat-sheet">
        <div className="eyebrow">Quick cheat sheet</div>
        <h2>Every level helps.</h2>
        <div className="cheat-item"><b>01</b><span><strong>Minimum</strong>GPS pin + one photo.</span></div>
        <div className="cheat-item"><b>02</b><span><strong>Useful</strong>Add route tags or a short note.</span></div>
        <div className="cheat-item"><b>03</b><span><strong>Great</strong>Parking, approach, anchors, panorama or GPX.</span></div>
        <p className="muted">Use your phone&apos;s original JPEG or HEIC. One clear image is better than ten nearly identical ones.</p>
      </aside>
      <div className="report-form">
        <div className="card report-box">
          <h2>Where are you?</h2>
          <div className="location-grid">
            <div>
              <div className="flabel-sm">Crag</div>
              {crag ? (
                <div className="gpsbox">
                  <span className="coords">{crag.n}</span>
                  <button className="chip" onClick={() => patch({ cragName: "", routeTags: {} })}>Change</button>
                </div>
              ) : (
                <>
                  <input className="search" placeholder="Search crag name..." value={report.cragName} onChange={(event) => patch({ cragName: event.target.value })} />
                  {matches.length > 0 && (
                    <div className="nearby" style={{ marginTop: 8 }}>
                      {matches.map((match) => (
                        <button key={match.n} className="prow" onClick={() => patch({ cragName: match.n, routeTags: {} })}>
                          <span className="rname">{match.n}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="hint">Not sure of the name? Leave it blank - your GPS pin still tells us where.</p>
                </>
              )}
            </div>
            <div>
              <div className="flabel-sm">GPS pin</div>
              {report.gps ? (
                <div className="gpsbox">
                  <span className="coords">{report.gps.lat.toFixed(5)}, {report.gps.lon.toFixed(5)}</span>
                  <button className="chip" onClick={() => locate("gps", setGpsStatus)}>Update</button>
                </div>
              ) : (
                <button className="btn btn-terra" onClick={() => locate("gps", setGpsStatus)} disabled={gpsStatus === "locating"}>
                  {gpsStatus === "locating" ? "Finding you..." : "Share my GPS"}
                </button>
              )}
              {gpsStatus === "denied" && <p className="hint" style={{ color: "var(--danger)" }}>Location denied - you can still prepare the report without it.</p>}
            </div>
          </div>
        </div>

        {crag && crag.routes.length > 0 && (
          <div className="card report-box">
            <h2>Which route(s)?</h2>
            <p className="hint">Optional - tag the routes this report is about.</p>
            <div className="route-tag-row">
              {crag.routes.map((route) => (
                <button key={route.n} className={`route-tag ${report.routeTags[route.n] ? "on" : ""}`} onClick={() => patch({ routeTags: { ...report.routeTags, [route.n]: !report.routeTags[route.n] } })}>
                  {route.n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card report-box">
          <h2>Photos and GPX</h2>
          <p className="hint">Routes, the wall, the approach or your track - whatever you have.</p>
          <details className="tips">
            <summary>What makes good evidence? (tap for tips)</summary>
            <ul>
              <li><strong>Photos:</strong> whole-route shots from the base, straight-on where possible.</li>
              <li><strong>Tracks:</strong> original GPX from your watch or navigation app.</li>
              <li><strong>Light:</strong> natural daylight with the wall visible.</li>
              <li><strong>Format:</strong> JPEG, HEIC and GPX can be added without editing.</li>
              <li>A rough file is still useful. Avoid duplicates of the exact same angle.</li>
            </ul>
          </details>
          <label className="drop">
            <strong>Drop photos or GPX here</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>Or tap to choose. Originals remain on this device until export.</p>
            <input type="file" multiple accept="image/*,.gpx" hidden onChange={(event) => { if (event.target.files) addFiles(event.target.files, "routes"); event.target.value = ""; }} />
          </label>
          {report.files.length > 0 && (
            <div className="files">
              {report.files.map((file) => (
                <div className="file" key={file.id}>
                  <EvidencePreview file={file} />
                  <div className="fm"><div className="fn" title={file.name}>{file.name}</div></div>
                  <button className="rm" aria-label="Remove" onClick={() => patch({ files: report.files.filter((entry) => entry.id !== file.id) })}>x</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card report-box">
          <h2>Notes</h2>
          <textarea className="gen" placeholder="Anything worth flagging - conditions, a loose hold, a wrong grade..." value={report.comment} onChange={(event) => patch({ comment: event.target.value })} />
        </div>

        <div className="card report-box report-box-compact">
          <h2>Top anchors &amp; hardware <span className="hint" style={{ fontWeight: 400 }}>- optional observation only</span></h2>
          <p className="hint">Do not test, alter or certify equipment. Only report what you can clearly see from a safe place.</p>
          <div className="anchor-row">
            <button className={`chip ${report.anchorCheck === "looks_ok" ? "on" : ""}`} onClick={() => patch({ anchorCheck: "looks_ok" })}>Looks normal</button>
            <button className={`chip ${report.anchorCheck === "needs_attention" ? "on" : ""}`} onClick={() => patch({ anchorCheck: "needs_attention" })}>Needs attention</button>
            <button className={`chip ${report.anchorCheck === "not_checked" ? "on" : ""}`} onClick={() => patch({ anchorCheck: "not_checked" })}>Not checked</button>
          </div>
          <textarea className="gen" placeholder="What did you observe? Example: loose hanger, worn lower-off, unclear anchor access..." value={report.anchorNotes} onChange={(event) => patch({ anchorNotes: event.target.value })} />
        </div>

        <div className="card report-box report-box-compact">
          <h2>Parking <span className="hint" style={{ fontWeight: 400 }}>- optional</span></h2>
          <div className="parking-row">
            {report.parkingGps ? (
              <div className="gpsbox gpsbox-sm">
                <span className="coords">{report.parkingGps.lat.toFixed(5)}, {report.parkingGps.lon.toFixed(5)}</span>
                <button className="chip" onClick={() => locate("parkingGps", setParkingGpsStatus)}>Update</button>
              </div>
            ) : (
              <button className="btn btn-ghost" onClick={() => locate("parkingGps", setParkingGpsStatus)} disabled={parkingGpsStatus === "locating"}>
                {parkingGpsStatus === "locating" ? "Finding you..." : "Pin GPS"}
              </button>
            )}
            <label className="btn btn-ghost">
              {report.parkingPhoto ? "Photo added" : "Add photo"}
              <input type="file" accept="image/*" hidden onChange={(event) => { if (event.target.files) addFiles(event.target.files, "parking"); event.target.value = ""; }} />
            </label>
            <input className="costfield-input" placeholder="Cost - e.g. free, EUR 3/day" value={report.parkingCost} onChange={(event) => patch({ parkingCost: event.target.value })} />
          </div>
        </div>

        <div className="submitbar">
          <span className="muted">
            {saveState === "error" ? "Could not save in this browser" : saveState === "saving" ? "Saving on this device..." : "Saved privately on this device"}
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(report.files.length > 0 || report.parkingPhoto) && <button className="btn btn-ghost" onClick={() => void exportPackage()} disabled={exporting}>{exporting ? "Building..." : "Export draft"}</button>}
            <button className="btn btn-terra" onClick={() => patch({ submitted: true })}>Mark ready on this device</button>
          </div>
        </div>
      </div>
    </div>
  );
}
