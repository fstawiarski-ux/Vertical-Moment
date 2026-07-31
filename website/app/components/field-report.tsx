"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import cragsData from "../data/crags.json";

type Crag = { n: string; la: number; lo: number; r: string[]; db: boolean; routes: { n: string }[] };
const CRAGS = cragsData as Crag[];

type Coords = { lat: number; lon: number } | null;
type FileMeta = { id: string; name: string; size: number; kind: string };

export function FieldReport() {
  const params = useSearchParams();
  const initialCrag = params.get("crag") || "";
  const [cragQuery, setCragQuery] = useState(initialCrag);
  const [crag, setCrag] = useState<Crag | null>(() => CRAGS.find(c => c.n === initialCrag) || null);

  const [gps, setGps] = useState<Coords>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "denied">("idle");
  const [routeTags, setRouteTags] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<FileMeta[]>([]);
  const previews = useRef<Record<string, string>>({});
  const [comment, setComment] = useState("");

  const [parkingGps, setParkingGps] = useState<Coords>(null);
  const [parkingGpsStatus, setParkingGpsStatus] = useState<"idle" | "locating" | "denied">("idle");
  const [parkingPhoto, setParkingPhoto] = useState<FileMeta | null>(null);
  const [parkingCost, setParkingCost] = useState("");
  const [anchorCheck, setAnchorCheck] = useState<"not_checked" | "looks_ok" | "needs_attention">("not_checked");
  const [anchorNotes, setAnchorNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const matches = useMemo(() => {
    if (crag || !cragQuery.trim()) return [];
    const s = cragQuery.toLowerCase();
    return CRAGS.filter(c => c.n.toLowerCase().includes(s)).slice(0, 8);
  }, [cragQuery, crag]);

  function locate(setter: (c: Coords) => void, setStatus: (s: "idle" | "locating" | "denied") => void) {
    if (!("geolocation" in navigator)) { setStatus("denied"); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      pos => { setter({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStatus("idle"); },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }

  function addFiles(list: FileList, target: "routes" | "parking") {
    const items = [...list].map(f => {
      const id = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const kind = f.type.startsWith("image/") ? "photo" : "file";
      if (kind === "photo") previews.current[id] = URL.createObjectURL(f);
      return { id, name: f.name, size: f.size, kind };
    });
    if (target === "routes") setFiles(prev => [...prev, ...items]);
    else if (items[0]) setParkingPhoto(items[0]);
  }

  function submit() {
    const report = {
      crag: crag?.n ?? cragQuery ?? null,
      gps, routeTags: Object.keys(routeTags).filter(k => routeTags[k]),
      files: files.map(f => ({ name: f.name, kind: f.kind })),
      comment,
      parking: { gps: parkingGps, photo: parkingPhoto?.name ?? null, cost: parkingCost },
      anchors: { check: anchorCheck, notes: anchorNotes },
      submittedAt: new Date().toISOString(),
    };
    try {
      const key = "vm-field-reports";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([...existing, report]));
    } catch {}
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card done">
        <div className="eyebrow">Thanks</div>
        <h1>Report sent.</h1>
        <p className="muted">
          {crag ? `${crag.n} — ` : ""}saved on this device for now. Once the review queue is live
          this goes straight to it — no account needed on your end, ever.
        </p>
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
        <p className="muted">Use your phone’s original JPEG or HEIC. One clear image is better than ten nearly identical ones.</p>
      </aside>
      <div className="report-form">
      {/* Location: crag + GPS pin together, since they're both "where" */}
      <div className="card report-box">
        <h2>Where are you?</h2>
        <div className="location-grid">
          <div>
            <div className="flabel-sm">Crag</div>
            {crag ? (
              <div className="gpsbox">
                <span className="coords">{crag.n}</span>
                <button className="chip" onClick={() => { setCrag(null); setCragQuery(""); }}>Change</button>
              </div>
            ) : (
              <>
                <input
                  className="search"
                  placeholder="Search crag name…"
                  value={cragQuery}
                  onChange={e => setCragQuery(e.target.value)}
                />
                {matches.length > 0 && (
                  <div className="nearby" style={{ marginTop: 8 }}>
                    {matches.map(m => (
                      <button key={m.n} className="prow" onClick={() => { setCrag(m); setCragQuery(m.n); }}>
                        <span className="rname">{m.n}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="hint">Not sure of the name? Leave blank — your GPS pin still tells us where.</p>
              </>
            )}
          </div>
          <div>
            <div className="flabel-sm">GPS pin</div>
            {gps ? (
              <div className="gpsbox">
                <span className="coords">{gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}</span>
                <button className="chip" onClick={() => locate(setGps, setGpsStatus)}>Update</button>
              </div>
            ) : (
              <button className="btn btn-terra" onClick={() => locate(setGps, setGpsStatus)} disabled={gpsStatus === "locating"}>
                {gpsStatus === "locating" ? "Finding you…" : "Share my GPS"}
              </button>
            )}
            {gpsStatus === "denied" && <p className="hint" style={{ color: "var(--danger)" }}>Location denied — you can still submit without it.</p>}
          </div>
        </div>
      </div>

      {crag && crag.routes.length > 0 && (
        <div className="card report-box">
          <h2>Which route(s)?</h2>
          <p className="hint">Optional — tag the routes this report is about.</p>
          <div className="route-tag-row">
            {crag.routes.map(r => (
              <button
                key={r.n}
                className={`route-tag ${routeTags[r.n] ? "on" : ""}`}
                onClick={() => setRouteTags(prev => ({ ...prev, [r.n]: !prev[r.n] }))}
              >
                {r.n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card report-box">
        <h2>Photos</h2>
        <p className="hint">Routes, the wall, the approach — whatever you&apos;ve got.</p>
        <details className="tips">
          <summary>What makes a good photo? (tap for tips)</summary>
          <ul>
            <li><strong>Good:</strong> whole-route shots taken from the base, straight-on — not angled or cropped.</li>
            <li><strong>Good:</strong> natural daylight, no heavy shadow across the wall.</li>
            <li><strong>Avoid:</strong> zoomed-in close-ups with no context, or photos of people that hide the rock.</li>
            <li><strong>Format:</strong> JPEG or HEIC straight from your phone is perfect — no editing needed.</li>
            <li>Don&apos;t worry about getting it perfect — a rough photo is still useful. Just avoid duplicates of the exact same angle.</li>
          </ul>
        </details>
        <label className="drop">
          <strong>Drop photos here</strong>
          <p className="muted" style={{ margin: "6px 0 0" }}>Or tap to choose.</p>
          <input type="file" multiple accept="image/*" hidden onChange={e => { if (e.target.files) addFiles(e.target.files, "routes"); e.target.value = ""; }} />
        </label>
        {files.length > 0 && (
          <div className="files">
            {files.map(f => (
              <div className="file" key={f.id}>
                {previews.current[f.id]
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={previews.current[f.id]} alt="" />
                  : <div className="ic">IMG</div>}
                <div className="fm"><div className="fn" title={f.name}>{f.name}</div></div>
                <button className="rm" aria-label="Remove" onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card report-box">
        <h2>Notes</h2>
        <textarea
          className="gen"
          placeholder="Anything worth flagging — conditions, a loose hold, a wrong grade…"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </div>

      <div className="card report-box report-box-compact">
        <h2>Top anchors &amp; hardware <span className="hint" style={{ fontWeight: 400 }}>— optional observation only</span></h2>
        <p className="hint">Do not test, alter or certify equipment. Only report what you can clearly see from a safe place.</p>
        <div className="anchor-row">
          <button className={`chip ${anchorCheck === "looks_ok" ? "on" : ""}`} onClick={() => setAnchorCheck("looks_ok")}>Looks normal</button>
          <button className={`chip ${anchorCheck === "needs_attention" ? "on" : ""}`} onClick={() => setAnchorCheck("needs_attention")}>Needs attention</button>
          <button className={`chip ${anchorCheck === "not_checked" ? "on" : ""}`} onClick={() => setAnchorCheck("not_checked")}>Not checked</button>
        </div>
        <textarea className="gen" placeholder="What did you observe? Example: loose hanger, worn lower-off, unclear anchor access…" value={anchorNotes} onChange={e => setAnchorNotes(e.target.value)} />
      </div>

      <div className="card report-box report-box-compact">
        <h2>Parking <span className="hint" style={{ fontWeight: 400 }}>— optional</span></h2>
        <div className="parking-row">
          {parkingGps ? (
            <div className="gpsbox gpsbox-sm">
              <span className="coords">{parkingGps.lat.toFixed(5)}, {parkingGps.lon.toFixed(5)}</span>
              <button className="chip" onClick={() => locate(setParkingGps, setParkingGpsStatus)}>Update</button>
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={() => locate(setParkingGps, setParkingGpsStatus)} disabled={parkingGpsStatus === "locating"}>
              {parkingGpsStatus === "locating" ? "Finding you…" : "Pin GPS"}
            </button>
          )}
          <label className="btn btn-ghost">
            {parkingPhoto ? "Photo ✓" : "Add photo"}
            <input type="file" accept="image/*" hidden onChange={e => { if (e.target.files) addFiles(e.target.files, "parking"); e.target.value = ""; }} />
          </label>
          <input className="costfield-input" placeholder="Cost — e.g. free, €3/day" value={parkingCost} onChange={e => setParkingCost(e.target.value)} />
        </div>
      </div>

      <div className="submitbar">
        <span className="muted">No account needed — this stays anonymous unless you say otherwise.</span>
        <button className="btn btn-terra" onClick={submit}>Send report</button>
      </div>
      </div>
    </div>
  );
}
