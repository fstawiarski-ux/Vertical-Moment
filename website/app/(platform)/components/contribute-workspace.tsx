"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import missionsData from "../data/missions.json";

type Item = { id: string; title: string; help: string; required: boolean; evidence: string };
type Mission = {
  id: string; code: string; typeLabel: string; title: string; location: string; priority: string;
  objective: string; needs: string[]; ctx: Record<string, string>; checklist: Item[]; mode?: "field" | "home";
};
type FileMeta = { id: string; name: string; size: number; kind: string; cap: string };
type Draft = {
  checked: Record<string, boolean>; notes: Record<string, string>; files: FileMeta[];
  general: string; confidence: number; prov: string; safety: boolean; submitted?: boolean;
};
const MISSIONS = missionsData as unknown as Mission[];
const PROV: [string, string][] = [
  ["personally_verified", "I verified this myself"], ["local_expert", "Confirmed by a local expert"],
  ["published_source", "From a published source"], ["estimated", "Estimated"], ["unconfirmed", "Unconfirmed"],
];
const emptyDraft = (): Draft => ({ checked: {}, notes: {}, files: [], general: "", confidence: 3, prov: "unconfirmed", safety: false });

export function ContributeWorkspace() {
  const [openId, setOpenId] = useState<string | null>(null);
  const mission = MISSIONS.find(m => m.id === openId) || null;
  return mission
    ? <MissionDetail mission={mission} onBack={() => setOpenId(null)} />
    : <Dashboard onOpen={setOpenId} />;
}

function progressOf(m: Mission): number {
  let d: Draft; try { d = { ...emptyDraft(), ...JSON.parse(localStorage.getItem("vm-draft-" + m.id) || "{}") }; } catch { d = emptyDraft(); }
  if (!m.checklist.length) return d.files.length ? 100 : 0;
  return Math.round(m.checklist.filter(i => d.checked[i.id]).length / m.checklist.length * 100);
}

function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const [filter, setFilter] = useState<"all" | "field" | "home">("all");
  const list = [...MISSIONS].filter(m => filter === "all" || (m.mode ?? "field") === filter).sort((a, b) => order[a.priority] - order[b.priority]);
  const [, force] = useState(0);
  useEffect(() => { force(x => x + 1); }, []); // recompute progress after mount (localStorage)
  return (
    <div>
      <div className="section-head">
        <div><div className="eyebrow">Your tasks</div><h1 style={{ fontSize: "clamp(28px,5vw,46px)" }}>What needs doing</h1></div>
        <span className="pill">{list.length} tasks</span>
      </div>
      <div className="card" style={{ padding: 16, margin: "0 0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="muted" style={{ fontSize: 13.5 }}>Not on this list? Send a quick GPS + photo report from any crag — no task required, no account needed.</span>
        <Link href="/report" className="btn btn-ghost">Report from here</Link>
      </div>
      <div className="task-filters" aria-label="Filter tasks by where they can be done">
        <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All</button>
        <button className={`chip ${filter === "field" ? "on" : ""}`} onClick={() => setFilter("field")}>Open field tasks</button>
        <button className={`chip ${filter === "home" ? "on" : ""}`} onClick={() => setFilter("home")}>Home / phone tasks</button>
      </div>
      <div className="mgrid">
        {list.map(m => {
          const p = typeof window !== "undefined" ? progressOf(m) : 0;
          return (
            <article key={m.id} className="card mission">
              <div className="top"><span className="eyebrow">{m.typeLabel}</span><span className={`prio ${m.priority}`}>{m.priority}</span></div>
              <h3>{m.title}</h3><p className="muted" style={{ margin: "2px 0" }}>{m.location}</p>
              <ul className="needs">
                {m.needs.slice(0, 2).map(n => <li key={n}>{n}</li>)}
                {m.needs.length > 2 && <li className="muted">+{m.needs.length - 2} more</li>}
              </ul>
              <div className="progress"><i style={{ width: `${p}%` }} /></div>
              <div className="mfoot"><small className="muted">{p}% ready</small>
                <button className="btn btn-terra" onClick={() => onOpen(m.id)}>Open task</button></div>
            </article>
          );
        })}
      </div>

      <div className="card" style={{ padding: 18, marginTop: 28 }}>
        <div className="eyebrow">Data transparency</div>
        <h3 style={{ fontSize: 18, margin: "4px 0 6px" }}>See what we collect</h3>
        <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px", maxWidth: 640 }}>
          Reference copies of the underlying dataset — open to view, not for direct editing.
          If something looks wrong, use &quot;Report from here&quot; instead of changing these files.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="btn btn-ghost" href="/data/vertical-moment-master-data.xlsx" download>Master data (.xlsx)</a>
          <a className="btn btn-ghost" href="/data/vertical-moment-gpx-tracks.zip" download>GPX tracks (.zip)</a>
        </div>
      </div>
    </div>
  );
}

function MissionDetail({ mission, onBack }: { mission: Mission; onBack: () => void }) {
  const key = "vm-draft-" + mission.id;
  const [d, setD] = useState<Draft>(emptyDraft());
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const previews = useRef<Record<string, string>>({});

  useEffect(() => {
    try { setD({ ...emptyDraft(), ...JSON.parse(localStorage.getItem(key) || "{}") }); } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    const stored = { ...d, files: d.files.map(({ ...f }) => f) };
    localStorage.setItem(key, JSON.stringify(stored));
    setSaved(true);
  }, [d, loaded, key]);

  const patch = (p: Partial<Draft>) => setD(prev => ({ ...prev, ...p }));
  const ctx = [mission.ctx.crag, mission.ctx.wall,
    mission.ctx.guidebook && (mission.ctx.guidebook + (mission.ctx.pages ? " · pp. " + mission.ctx.pages : "")),
    mission.ctx.coord].filter(Boolean) as string[];
  const reqLeft = mission.checklist.filter(i => i.required && !d.checked[i.id]).length;
  const prog = useMemo(() => {
    if (!mission.checklist.length) return d.files.length ? 100 : 0;
    return Math.round(mission.checklist.filter(i => d.checked[i.id]).length / mission.checklist.length * 100);
  }, [d, mission]);

  function addFiles(list: FileList) {
    const added: FileMeta[] = [...list].map(f => {
      const id = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const kind = /\.gpx$/i.test(f.name) ? "gpx" : /\.pdf$/i.test(f.name) ? "pdf" : f.type.startsWith("image/") ? "photo" : "file";
      if (kind === "photo") previews.current[id] = URL.createObjectURL(f);
      return { id, name: f.name, size: f.size, kind, cap: "" };
    });
    patch({ files: [...d.files, ...added] });
  }

  if (d.submitted) {
    return (
      <div className="card done">
        <div className="eyebrow">Submitted for review</div>
        <h1>Thanks — {mission.title} is in.</h1>
        <p className="muted">{d.files.length} file(s) and your notes were packaged. Nothing publishes until it&apos;s reviewed.</p>
        <button className="btn btn-forest" onClick={onBack}>Back to tasks</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack}>← Tasks</button>
      <div className="section-head" style={{ marginTop: 14 }}>
        <div><div className="eyebrow">{mission.code}</div>
          <h1 style={{ fontSize: "clamp(26px,4vw,40px)" }}>{mission.title}</h1>
          <p className="muted">{mission.location}</p></div>
        <span className="pill">{prog}% ready</span>
      </div>
      <div className="progress"><i style={{ width: `${prog}%` }} /></div>

      <div className="card brief">
        <p>{mission.objective}</p>
        <div className="chipline">{ctx.map(c => <span key={c} className="pill">{c}</span>)}</div>
        <div className="eyebrow">What&apos;s needed</div>
        <ul className="needs2">{mission.needs.map(n => <li key={n}>{n}</li>)}</ul>
      </div>

      <div className="blockh"><h2 style={{ fontSize: 20 }}>Confirm as you go</h2></div>
      <div className="checklist">
        {mission.checklist.map(i => (
          <label className="check" key={i.id}>
            <input type="checkbox" checked={!!d.checked[i.id]} onChange={e => patch({ checked: { ...d.checked, [i.id]: e.target.checked } })} />
            <div className="body">
              <strong>{i.title}{i.required && <span className="req"> *</span>}</strong><br />
              <small className="muted">{i.help}</small>
              {i.evidence === "note" && (
                <textarea placeholder="Type your note…" value={d.notes[i.id] || ""} onChange={e => patch({ notes: { ...d.notes, [i.id]: e.target.value } })} />
              )}
            </div>
            <span className="pill">{i.evidence === "none" ? "confirm" : i.evidence}</span>
          </label>
        ))}
      </div>

      <div className="blockh"><h2 style={{ fontSize: 20 }}>Add your evidence</h2></div>
      <div className="card evi">
        <label className="drop">
          <strong>Drop photos, GPX or PDFs here</strong>
          <p className="muted" style={{ margin: "6px 0 0" }}>Or tap to choose. Files stay on your device until you submit.</p>
          <input type="file" multiple accept="image/*,.gpx,.pdf" hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {d.files.length > 0 && (
          <div className="files">
            {d.files.map(f => (
              <div className="file" key={f.id}>
                {previews.current[f.id]
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={previews.current[f.id]} alt="" />
                  : <div className="ic">{f.kind === "gpx" ? "GPX" : f.kind === "pdf" ? "PDF" : f.kind === "photo" ? "IMG" : "FILE"}</div>}
                <div className="fm">
                  <div className="fn" title={f.name}>{f.name}</div>
                  <input className="cap" placeholder="Caption…" value={f.cap} onChange={e => patch({ files: d.files.map(x => x.id === f.id ? { ...x, cap: e.target.value } : x) })} />
                </div>
                <button className="rm" aria-label="Remove" onClick={() => patch({ files: d.files.filter(x => x.id !== f.id) })}>×</button>
              </div>
            ))}
          </div>
        )}
        <textarea className="gen" placeholder="Anything else — conflicts, uncertainty, local confirmation…" value={d.general} onChange={e => patch({ general: e.target.value })} />
      </div>

      <div className="card trust">
        <div className="field"><span className="flabel">How sure are you?</span>
          <div className="conf">{[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={`confd ${d.confidence >= n ? "on" : ""}`} onClick={() => patch({ confidence: n })}>{n}</button>
          ))}</div></div>
        <div className="field"><span className="flabel">Where does this come from?</span>
          <select className="sel" value={d.prov} onChange={e => patch({ prov: e.target.value })}>
            {PROV.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <label className="safety">
          <input type="checkbox" checked={d.safety} onChange={e => patch({ safety: e.target.checked })} />
          <span><strong>Raise a safety note</strong><small className="muted"> — flags this for priority review. Records an observation, not a certification.</small></span>
        </label>
      </div>

      <div className="submitbar">
        <span className="muted">{saved ? "Saved on this device" : "Autosaves as you go"}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {reqLeft > 0 && <span className="muted">{reqLeft} required item(s) left</span>}
          <button className="btn btn-terra" disabled={reqLeft > 0} onClick={() => patch({ submitted: true })}>Submit for review</button>
        </div>
      </div>
    </div>
  );
}
