"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import missionsData from "../data/missions.json";
import {
  downloadContributionArchive,
  readContributionDraft,
  safeArchiveName,
  storeEvidenceFile,
  writeContributionDraft,
  type LocalEvidenceFile,
} from "@/lib/contribution-local";

type Item = { id: string; title: string; help: string; required: boolean; evidence: string };
type Mission = {
  id: string;
  code: string;
  typeLabel: string;
  title: string;
  location: string;
  priority: string;
  objective: string;
  needs: string[];
  ctx: Record<string, string>;
  checklist: Item[];
  mode?: "field" | "home";
};
type Draft = {
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  files: LocalEvidenceFile[];
  general: string;
  confidence: number;
  prov: string;
  safety: boolean;
  submitted?: boolean;
};
type SaveState = "loading" | "saving" | "saved" | "error";

const MISSIONS = missionsData as unknown as Mission[];
const PROV: [string, string][] = [
  ["personally_verified", "I verified this myself"],
  ["local_expert", "Confirmed by a local expert"],
  ["published_source", "From a published source"],
  ["estimated", "Estimated"],
  ["unconfirmed", "Unconfirmed"],
];
const emptyDraft = (): Draft => ({
  checked: {},
  notes: {},
  files: [],
  general: "",
  confidence: 3,
  prov: "unconfirmed",
  safety: false,
});

export function ContributeWorkspace() {
  const [openId, setOpenId] = useState<string | null>(null);
  const mission = MISSIONS.find((entry) => entry.id === openId) || null;
  return mission
    ? <MissionDetail mission={mission} onBack={() => setOpenId(null)} />
    : <Dashboard onOpen={setOpenId} />;
}

function progressOf(mission: Mission, draft: Draft): number {
  if (!mission.checklist.length) return draft.files.length ? 100 : 0;
  return Math.round(mission.checklist.filter((item) => draft.checked[item.id]).length / mission.checklist.length * 100);
}

function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const [filter, setFilter] = useState<"all" | "field" | "home">("all");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const list = [...MISSIONS]
    .filter((mission) => filter === "all" || (mission.mode ?? "field") === filter)
    .sort((a, b) => order[a.priority] - order[b.priority]);

  useEffect(() => {
    let active = true;
    void Promise.all(MISSIONS.map(async (mission) => {
      try {
        return [mission.id, await readContributionDraft<Draft>(`mission:${mission.id}:v1`)] as const;
      } catch {
        return [mission.id, null] as const;
      }
    })).then((records) => {
      if (!active) return;
      const next: Record<string, Draft> = {};
      for (const [id, draft] of records) if (draft) next[id] = draft;
      setDrafts(next);
    });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="section-head">
        <div><div className="eyebrow">Your tasks</div><h1 style={{ fontSize: "clamp(28px,5vw,46px)" }}>What needs doing</h1></div>
        <span className="pill">{list.length} tasks</span>
      </div>
      <div className="card" style={{ padding: 16, margin: "0 0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="muted" style={{ fontSize: 13.5 }}>Not on this list? Prepare a quick GPS, photo or GPX field note from any crag - no task or account required.</span>
        <Link href="/contribute#quick-report" className="btn btn-ghost">Create a field note</Link>
      </div>
      <div className="task-filters" aria-label="Filter tasks by where they can be done">
        <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>All</button>
        <button className={`chip ${filter === "field" ? "on" : ""}`} onClick={() => setFilter("field")}>Open field tasks</button>
        <button className={`chip ${filter === "home" ? "on" : ""}`} onClick={() => setFilter("home")}>Home / phone tasks</button>
      </div>
      <div className="mgrid">
        {list.map((mission) => {
          const draft = drafts[mission.id] ?? emptyDraft();
          const progress = progressOf(mission, draft);
          return (
            <article key={mission.id} className="card mission">
              <div className="top"><span className="eyebrow">{mission.typeLabel}</span><span className={`prio ${mission.priority}`}>{mission.priority}</span></div>
              <h3>{mission.title}</h3><p className="muted" style={{ margin: "2px 0" }}>{mission.location}</p>
              <ul className="needs">
                {mission.needs.slice(0, 2).map((need) => <li key={need}>{need}</li>)}
                {mission.needs.length > 2 && <li className="muted">+{mission.needs.length - 2} more</li>}
              </ul>
              <div className="progress"><i style={{ width: `${progress}%` }} /></div>
              <div className="mfoot">
                <small className="muted">{draft.submitted ? "Ready on this device" : `${progress}% ready`}</small>
                <button className="btn btn-terra" onClick={() => onOpen(mission.id)}>Open task</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="card" style={{ padding: 18, marginTop: 28 }}>
        <div className="eyebrow">Data transparency</div>
        <h3 style={{ fontSize: 18, margin: "4px 0 6px" }}>See what we collect</h3>
        <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px", maxWidth: 640 }}>
          Reference copies of the underlying dataset - open to view, not for direct editing.
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
  return <div className="ic">{file.kind === "gpx" ? "GPX" : file.kind === "pdf" ? "PDF" : file.kind === "photo" ? "IMG" : "FILE"}</div>;
}

function MissionDetail({ mission, onBack }: { mission: Mission; onBack: () => void }) {
  const key = `mission:${mission.id}:v1`;
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setSaveState("loading");
    void readContributionDraft<Draft>(key)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          setDraft({ ...emptyDraft(), ...stored, files: stored.files ?? [] });
          return;
        }
        try {
          const legacy = JSON.parse(localStorage.getItem(`vm-draft-${mission.id}`) || "null") as Partial<Draft> | null;
          if (legacy) setDraft({ ...emptyDraft(), ...legacy, files: [] });
        } catch {
          // Invalid metadata from the old prototype is safely ignored.
        }
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
  }, [key, mission.id]);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      void writeContributionDraft(key, draft)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [draft, key, loaded]);

  const patch = (value: Partial<Draft>) => setDraft((previous) => ({ ...previous, ...value }));
  const context = [
    mission.ctx.crag,
    mission.ctx.wall,
    mission.ctx.guidebook && (mission.ctx.guidebook + (mission.ctx.pages ? ` - pp. ${mission.ctx.pages}` : "")),
    mission.ctx.coord,
  ].filter(Boolean) as string[];
  const requiredLeft = mission.checklist.filter((item) => item.required && !draft.checked[item.id]).length;
  const progress = useMemo(() => progressOf(mission, draft), [draft, mission]);

  function addFiles(list: FileList) {
    patch({ files: [...draft.files, ...[...list].map(storeEvidenceFile)] });
  }

  async function exportPackage() {
    setExporting(true);
    try {
      await downloadContributionArchive(
        `vertical-moment-${safeArchiveName(mission.code)}-${new Date().toISOString().slice(0, 10)}.zip`,
        {
          format: "vertical-moment-contribution/v1",
          kind: "mission",
          exportedAt: new Date().toISOString(),
          mission: { id: mission.id, code: mission.code, title: mission.title, location: mission.location },
          answers: {
            checked: draft.checked,
            notes: draft.notes,
            general: draft.general,
            confidence: draft.confidence,
            provenance: draft.prov,
            safetyNote: draft.safety,
          },
          files: draft.files.map(({ blob: _blob, ...file }) => file),
        },
        draft.files,
      );
    } finally {
      setExporting(false);
    }
  }

  if (!loaded) return <div className="card done"><p className="muted">Opening the draft on this device...</p></div>;

  if (draft.submitted) {
    return (
      <div className="card done">
        <div className="eyebrow">Ready on this device</div>
        <h1>{mission.title} is prepared.</h1>
        <p className="muted">Nothing has uploaded or published. Export the ZIP review package when you want to inspect, move or share the draft.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-terra" onClick={() => void exportPackage()} disabled={exporting}>
            {exporting ? "Building package..." : `Export review package (${draft.files.length} files)`}
          </button>
          <button className="btn btn-ghost" onClick={() => patch({ submitted: false })}>Continue editing</button>
          <button className="btn btn-forest" onClick={onBack}>Back to tasks</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack}>&larr; Tasks</button>
      <div className="section-head" style={{ marginTop: 14 }}>
        <div><div className="eyebrow">{mission.code}</div>
          <h1 style={{ fontSize: "clamp(26px,4vw,40px)" }}>{mission.title}</h1>
          <p className="muted">{mission.location}</p></div>
        <span className="pill">{progress}% ready</span>
      </div>
      <div className="progress"><i style={{ width: `${progress}%` }} /></div>

      <div className="card brief">
        <p>{mission.objective}</p>
        <div className="chipline">{context.map((entry) => <span key={entry} className="pill">{entry}</span>)}</div>
        <div className="eyebrow">What&apos;s needed</div>
        <ul className="needs2">{mission.needs.map((need) => <li key={need}>{need}</li>)}</ul>
      </div>

      <div className="blockh"><h2 style={{ fontSize: 20 }}>Confirm as you go</h2></div>
      <div className="checklist">
        {mission.checklist.map((item) => (
          <label className="check" key={item.id}>
            <input type="checkbox" checked={!!draft.checked[item.id]} onChange={(event) => patch({ checked: { ...draft.checked, [item.id]: event.target.checked } })} />
            <div className="body">
              <strong>{item.title}{item.required && <span className="req"> *</span>}</strong><br />
              <small className="muted">{item.help}</small>
              {item.evidence === "note" && (
                <textarea placeholder="Type your note..." value={draft.notes[item.id] || ""} onChange={(event) => patch({ notes: { ...draft.notes, [item.id]: event.target.value } })} />
              )}
            </div>
            <span className="pill">{item.evidence === "none" ? "confirm" : item.evidence}</span>
          </label>
        ))}
      </div>

      <div className="blockh"><h2 style={{ fontSize: 20 }}>Add your evidence</h2></div>
      <div className="card evi">
        <label className="drop">
          <strong>Drop photos, GPX or PDFs here</strong>
          <p className="muted" style={{ margin: "6px 0 0" }}>Or tap to choose. Original files remain on this device until you export them.</p>
          <input type="file" multiple accept="image/*,.gpx,.pdf" hidden onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        </label>
        {draft.files.length > 0 && (
          <div className="files">
            {draft.files.map((file) => (
              <div className="file" key={file.id}>
                <EvidencePreview file={file} />
                <div className="fm">
                  <div className="fn" title={file.name}>{file.name}</div>
                  <input className="cap" placeholder="Caption..." value={file.caption} onChange={(event) => patch({ files: draft.files.map((entry) => entry.id === file.id ? { ...entry, caption: event.target.value } : entry) })} />
                </div>
                <button className="rm" aria-label="Remove" onClick={() => patch({ files: draft.files.filter((entry) => entry.id !== file.id) })}>x</button>
              </div>
            ))}
          </div>
        )}
        <textarea className="gen" placeholder="Anything else - conflicts, uncertainty, local confirmation..." value={draft.general} onChange={(event) => patch({ general: event.target.value })} />
      </div>

      <div className="card trust">
        <div className="field"><span className="flabel">How sure are you?</span>
          <div className="conf">{[1, 2, 3, 4, 5].map((number) => (
            <button key={number} className={`confd ${draft.confidence >= number ? "on" : ""}`} onClick={() => patch({ confidence: number })}>{number}</button>
          ))}</div></div>
        <div className="field"><span className="flabel">Where does this come from?</span>
          <select className="sel" value={draft.prov} onChange={(event) => patch({ prov: event.target.value })}>
            {PROV.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></div>
        <label className="safety">
          <input type="checkbox" checked={draft.safety} onChange={(event) => patch({ safety: event.target.checked })} />
          <span><strong>Raise a safety note</strong><small className="muted"> - flags this for priority review. Records an observation, not a certification.</small></span>
        </label>
      </div>

      <div className="submitbar">
        <span className="muted">
          {saveState === "error" ? "Could not save in this browser" : saveState === "saving" ? "Saving on this device..." : "Saved on this device"}
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {requiredLeft > 0 && <span className="muted">{requiredLeft} required item(s) left</span>}
          {draft.files.length > 0 && <button className="btn btn-ghost" onClick={() => void exportPackage()} disabled={exporting}>{exporting ? "Building..." : "Export draft"}</button>}
          <button className="btn btn-terra" disabled={requiredLeft > 0} onClick={() => patch({ submitted: true })}>Mark ready on this device</button>
        </div>
      </div>
    </div>
  );
}
