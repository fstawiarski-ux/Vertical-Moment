"use client";

import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { EMPTY_FIELD_OPS_STATE, missingCaptureItems, normalizeFieldOpsState, stopStateFor } from "./fieldOpsState";
import type { FieldOpsClientState, FieldOpsGpsFix, FieldOpsNote, FieldOpsPlan, FieldOpsStopState } from "./types";
import styles from "./FieldOpsApp.module.css";

const PLAN_CACHE_KEY = "vm-field-ops-plan-v1";
const STATE_CACHE_KEY = "vm-field-ops-state-v1";
const AUTH_MARKER = "vm-field-ops-authorized";
const AUTH_EVENT = "vm:field-ops-auth";

type LoadStatus = "loading" | "locked" | "ready" | "offline" | "unconfigured" | "error";
type Panel = "today" | "capture" | "relay" | "gaps" | "notes";

function nowIso() {
  return new Date().toISOString();
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FieldOpsApp() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [plan, setPlan] = useState<FieldOpsPlan | null>(null);
  const [clientState, setClientState] = useState<FieldOpsClientState>(EMPTY_FIELD_OPS_STATE);
  const [panel, setPanel] = useState<Panel>("today");
  const [accessKey, setAccessKey] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("Other");
  const [gpsBusy, setGpsBusy] = useState(false);
  const [copyState, setCopyState] = useState<string | null>(null);

  const acceptPlan = useCallback(async (nextPlan: FieldOpsPlan, nextStatus: LoadStatus) => {
    const storedState = await get<FieldOpsClientState>(STATE_CACHE_KEY).catch(() => undefined);
    const normalized = normalizeFieldOpsState(nextPlan, storedState);
    setPlan(nextPlan);
    setClientState(normalized);
    setStatus(nextStatus);
    await set(PLAN_CACHE_KEY, nextPlan).catch(() => undefined);
    try { window.localStorage.setItem(AUTH_MARKER, "1"); } catch { /* Private browsing/storage policy may block the launcher marker. */ }
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const loadSession = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/field-ops/session", { cache: "no-store", credentials: "same-origin" });
      if (response.ok) {
        const payload = await response.json() as { plan: FieldOpsPlan };
        await acceptPlan(payload.plan, "ready");
        return;
      }
      if (response.status === 401) {
        setStatus("locked");
        return;
      }
      if (response.status === 503) {
        setStatus("unconfigured");
        return;
      }
      throw new Error(`Field Ops returned ${response.status}`);
    } catch {
      const cached = await get<FieldOpsPlan>(PLAN_CACHE_KEY).catch(() => undefined);
      if (cached) {
        await acceptPlan(cached, "offline");
        return;
      }
      setStatus("error");
    }
  }, [acceptPlan]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!plan || status === "loading" || status === "locked") return;
    void set(STATE_CACHE_KEY, clientState).catch(() => undefined);
  }, [clientState, plan, status]);

  const selectedWeekend = useMemo(() => {
    if (!plan) return null;
    return plan.weekends.find((weekend) => weekend.id === clientState.selectedWeekendId) ?? plan.weekends[0] ?? null;
  }, [clientState.selectedWeekendId, plan]);

  const selectedDay = useMemo(() => {
    if (!selectedWeekend) return null;
    return selectedWeekend.days.find((day) => day.id === clientState.selectedDayId) ?? selectedWeekend.days[0] ?? null;
  }, [clientState.selectedDayId, selectedWeekend]);

  const activeStop = useMemo(() => {
    if (!selectedDay) return null;
    const wanted = clientState.activeStopByDay[selectedDay.id];
    return selectedDay.stops.find((stop) => stop.id === wanted) ?? selectedDay.stops[0] ?? null;
  }, [clientState.activeStopByDay, selectedDay]);

  const activeStopState = useMemo(() => activeStop ? stopStateFor(clientState, activeStop.id) : null, [activeStop, clientState]);
  const gaps = useMemo(() => plan && activeStop ? missingCaptureItems(plan, clientState, activeStop.id) : [], [activeStop, clientState, plan]);

  const updateStopState = useCallback((stopId: string, updater: (current: FieldOpsStopState) => FieldOpsStopState) => {
    setClientState((current) => {
      const existing = stopStateFor(current, stopId);
      const next = updater(existing);
      return {
        ...current,
        stops: {
          ...current.stops,
          [stopId]: { ...next, updatedAt: nowIso() },
        },
      };
    });
  }, []);

  const chooseWeekend = (weekendId: string) => {
    if (!plan) return;
    const weekend = plan.weekends.find((candidate) => candidate.id === weekendId);
    if (!weekend) return;
    setClientState((current) => ({
      ...current,
      selectedWeekendId: weekend.id,
      selectedDayId: weekend.days[0]?.id,
    }));
  };

  const chooseDay = (dayId: string) => {
    setClientState((current) => ({ ...current, selectedDayId: dayId }));
  };

  const chooseStop = (stopId: string) => {
    if (!selectedDay) return;
    setClientState((current) => ({
      ...current,
      activeStopByDay: { ...current.activeStopByDay, [selectedDay.id]: stopId },
    }));
  };

  const toggleCheck = (id: string) => {
    if (!activeStop) return;
    updateStopState(activeStop.id, (current) => ({
      ...current,
      checks: { ...current.checks, [id]: !current.checks[id] },
    }));
  };

  const toggleRelay = (id: string) => {
    if (!activeStop) return;
    updateStopState(activeStop.id, (current) => ({
      ...current,
      relay: { ...current.relay, [id]: !current.relay[id] },
    }));
  };

  const readCurrentGps = useCallback(async (): Promise<FieldOpsGpsFix | null> => {
    if (!navigator.geolocation) return null;
    setGpsBusy(true);
    try {
      return await new Promise<FieldOpsGpsFix>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
            capturedAt: nowIso(),
          }),
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      });
    } catch {
      return null;
    } finally {
      setGpsBusy(false);
    }
  }, []);

  const captureGps = async () => {
    if (!activeStop) return;
    const gps = await readCurrentGps();
    if (!gps) {
      setCopyState("GPS unavailable — log manually and keep uncertainty explicit.");
      return;
    }
    updateStopState(activeStop.id, (current) => ({
      ...current,
      gps,
      checks: { ...current.checks, gps: true },
    }));
    setCopyState(`GPS captured: ${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`);
  };

  const addNote = async () => {
    if (!activeStop || !noteText.trim()) return;
    const note: FieldOpsNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: noteCategory,
      text: noteText.trim(),
      createdAt: nowIso(),
    };
    updateStopState(activeStop.id, (current) => ({ ...current, notes: [...current.notes, note] }));
    setNoteText("");
  };

  const buildHandoff = useCallback(() => {
    if (!plan || !selectedWeekend || !selectedDay || !activeStop || !activeStopState) return "";
    const completed = plan.captureItems.filter((item) => activeStopState.checks[item.id]).map((item) => item.label);
    const missing = gaps.slice(0, 10).map((item) => `${item.tier.toUpperCase()}: ${item.label}`);
    const relayDone = plan.relayItems.filter((item) => activeStopState.relay[item.id]).map((item) => item.label);
    const notes = activeStopState.notes.slice(-8).map((note) => `[${note.category}] ${note.text}`);
    const gps = activeStopState.gps ? `${activeStopState.gps.latitude}, ${activeStopState.gps.longitude} ±${activeStopState.gps.accuracy ?? "?"}m` : "not captured";
    return [
      "VERTICAL MOMENT — FIELD OPS HANDOFF",
      `Weekend: ${selectedWeekend.label} — ${selectedWeekend.cluster}`,
      `Day: ${selectedDay.label}${clientState.dates[selectedDay.id] ? ` — ${clientState.dates[selectedDay.id]}` : ""}`,
      `Region: ${activeStop.region}`,
      `Focus: ${activeStop.focus}`,
      `GPS: ${gps}`,
      "",
      `Completed capture: ${completed.length ? completed.join(" · ") : "none marked"}`,
      "Missing / revisit before leaving:",
      ...(missing.length ? missing.map((item) => `- ${item}`) : ["- No checklist gaps remain."]),
      "",
      `Relay completed: ${relayDone.length ? relayDone.join(" · ") : "none marked"}`,
      "Field notes:",
      ...(notes.length ? notes.map((item) => `- ${item}`) : ["- none"]),
      "",
      "Agent rules: do not invent route lines, access, GPS, sector identity or provenance. Treat uncertainty explicitly. Prepare drafts/review queues only; do not publish or merge.",
    ].join("\n");
  }, [activeStop, activeStopState, clientState.dates, gaps, plan, selectedDay, selectedWeekend]);

  const copyHandoff = async () => {
    const text = buildHandoff();
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    setCopyState("Field handoff copied.");
  };

  const shareHandoff = async () => {
    const text = buildHandoff();
    if (!text) return;
    if (navigator.share) {
      await navigator.share({ title: `Field Ops — ${activeStop?.region ?? "session"}`, text }).catch(() => undefined);
      return;
    }
    await copyHandoff();
  };

  const exportSession = () => {
    if (!plan || !selectedWeekend || !selectedDay || !activeStop || !activeStopState) return;
    const slug = activeStop.region.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    downloadJson(`field-ops_${clientState.dates[selectedDay.id] || "undated"}_${slug}.json`, {
      schema: "vertical-moment-field-ops-session/v1",
      exportedAt: nowIso(),
      planVersion: plan.version,
      weekend: { id: selectedWeekend.id, label: selectedWeekend.label, cluster: selectedWeekend.cluster },
      day: { id: selectedDay.id, label: selectedDay.label, date: clientState.dates[selectedDay.id] || null },
      stop: activeStop,
      state: activeStopState,
      gaps,
      handoff: buildHandoff(),
    });
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(null);
    try {
      const response = await fetch("/api/field-ops/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
        credentials: "same-origin",
      });
      if (!response.ok) {
        if (response.status === 503) setStatus("unconfigured");
        else setAuthError("Access code not accepted.");
        return;
      }
      const payload = await response.json() as { plan: FieldOpsPlan };
      setAccessKey("");
      await acceptPlan(payload.plan, "ready");
    } catch {
      setAuthError("Network unavailable. Unlock once online, then the cached Field Ops plan can work offline.");
    }
  };

  const forgetDevice = async () => {
    await fetch("/api/field-ops/session", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
    await Promise.all([del(PLAN_CACHE_KEY), del(STATE_CACHE_KEY)]).catch(() => undefined);
    try { window.localStorage.removeItem(AUTH_MARKER); } catch { /* The server cookie is still cleared when online. */ }
    window.dispatchEvent(new Event(AUTH_EVENT));
    setPlan(null);
    setClientState(EMPTY_FIELD_OPS_STATE);
    setStatus("locked");
  };

  if (status === "loading") {
    return <main className={styles.center}><div className={styles.spinner} /><p>Preparing Field Ops…</p></main>;
  }

  if (status === "unconfigured") {
    return (
      <main className={styles.center}>
        <section className={styles.accessCard}>
          <span className={styles.kicker}>PRIVATE FIELD MODE</span>
          <h1>Field Ops needs a server secret.</h1>
          <p>Set a strong <code>FIELD_OPS_ACCESS_KEY</code> (minimum 24 characters) in local <code>.env.local</code> and as a Cloudflare runtime secret. Do not commit the value.</p>
          <a href="/explore-app">Back to Explore</a>
        </section>
      </main>
    );
  }

  if (status === "locked") {
    return (
      <main className={styles.center}>
        <form className={styles.accessCard} onSubmit={login}>
          <span className={styles.kicker}>PRIVATE FIELD MODE</span>
          <h1>Unlock Field Ops</h1>
          <p>The operational plan and cached session data stay behind an owner access key. The key is checked server-side and is never stored in the browser.</p>
          <label>
            Access key
            <input type="password" autoComplete="off" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} minLength={24} required />
          </label>
          {authError && <p className={styles.error}>{authError}</p>}
          <button type="submit">Unlock this device</button>
          <a href="/explore-app">Back to Explore</a>
        </form>
      </main>
    );
  }

  if (status === "error" || !plan || !selectedWeekend || !selectedDay || !activeStop || !activeStopState) {
    return (
      <main className={styles.center}>
        <section className={styles.accessCard}>
          <h1>Field Ops could not start.</h1>
          <p>No authenticated response or offline cache is available on this device yet.</p>
          <button type="button" onClick={() => void loadSession()}>Retry</button>
          <a href="/explore-app">Back to Explore</a>
        </section>
      </main>
    );
  }

  const requiredMissing = gaps.filter((item) => item.tier === "required").length;
  const captureDone = plan.captureItems.filter((item) => activeStopState.checks[item.id]).length;
  const relayDone = plan.relayItems.filter((item) => activeStopState.relay[item.id]).length;

  return (
    <main className={styles.app} data-connection={status === "offline" ? "offline" : "online"}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>VERTICAL MOMENT · PRIVATE</span>
          <h1>Field Ops</h1>
          <p>{selectedWeekend.label} · {selectedWeekend.cluster} · {selectedDay.label}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.connection}>{status === "offline" ? "OFFLINE · CACHED" : "ONLINE · SYNC READY"}</span>
          <a href="/explore-app">Explore</a>
        </div>
      </header>

      <section className={styles.selectorBar} aria-label="Trip selection">
        <select aria-label="Weekend" value={selectedWeekend.id} onChange={(event) => chooseWeekend(event.target.value)}>
          {plan.weekends.map((weekend) => <option key={weekend.id} value={weekend.id}>{weekend.label} — {weekend.cluster}</option>)}
        </select>
        <select aria-label="Day" value={selectedDay.id} onChange={(event) => chooseDay(event.target.value)}>
          {selectedWeekend.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}
        </select>
        <input aria-label="Field date" type="date" value={clientState.dates[selectedDay.id] ?? ""} onChange={(event) => setClientState((current) => ({ ...current, dates: { ...current.dates, [selectedDay.id]: event.target.value } }))} />
      </section>

      <nav className={styles.tabs} aria-label="Field Ops panels">
        {(["today", "capture", "relay", "gaps", "notes"] as Panel[]).map((item) => (
          <button key={item} type="button" data-active={panel === item ? "true" : "false"} onClick={() => setPanel(item)}>
            {item === "gaps" ? `Gaps ${requiredMissing ? `· ${requiredMissing}` : ""}` : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <section className={styles.heroStrip}>
        <div>
          <small>ACTIVE FIELD SESSION</small>
          <strong>{activeStop.region}</strong>
          <span>{activeStop.focus}</span>
        </div>
        <div className={styles.progressPair}>
          <span>Capture <strong>{captureDone}/{plan.captureItems.length}</strong></span>
          <span>Relay <strong>{relayDone}/{plan.relayItems.length}</strong></span>
        </div>
      </section>

      {panel === "today" && (
        <section className={styles.panelGrid}>
          <article className={styles.primaryCard}>
            <small>GO NOW</small>
            <h2>{selectedDay.routeLabel}</h2>
            <div className={styles.buttonRow}>
              <a className={styles.primaryAction} href={selectedDay.routeUrl} target="_blank" rel="noreferrer">Open day route</a>
              <a href={activeStop.mapsUrl} target="_blank" rel="noreferrer">Current region map</a>
            </div>
            <div className={styles.stopList}>
              {selectedDay.stops.map((stopItem, index) => (
                <button key={stopItem.id} type="button" data-active={stopItem.id === activeStop.id ? "true" : "false"} onClick={() => chooseStop(stopItem.id)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{stopItem.region}</strong><small>{stopItem.focus}</small></div>
                </button>
              ))}
            </div>
          </article>
          <article className={styles.card}><small>FOOD</small><p>{selectedDay.foodPlan}</p></article>
          <article className={styles.card}><small>SLEEP</small><p>{selectedDay.sleepPlan}</p></article>
          <article className={styles.card}>
            <small>RED FLAGS</small>
            <ul>{selectedDay.redFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
          </article>
          <article className={styles.card}>
            <small>LIVE CHECKS</small>
            <div className={styles.linkStack}>{plan.liveChecks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
          </article>
          <article className={styles.card}>
            <small>DAILY RHYTHM</small>
            <ol>{plan.dailyRoutine.map((item) => <li key={item}>{item}</li>)}</ol>
          </article>
        </section>
      )}

      {panel === "capture" && (
        <section className={styles.panelGrid}>
          <article className={styles.primaryCard}>
            <div className={styles.cardHeader}>
              <div><small>CAPTURE</small><h2>{activeStop.region}</h2></div>
              <button type="button" onClick={() => void captureGps()} disabled={gpsBusy}>{gpsBusy ? "GPS…" : "Use current GPS"}</button>
            </div>
            {activeStopState.gps && <p className={styles.gps}>GPS {activeStopState.gps.latitude.toFixed(6)}, {activeStopState.gps.longitude.toFixed(6)} · ±{activeStopState.gps.accuracy ?? "?"}m</p>}
            <div className={styles.checklist}>
              {plan.captureItems.map((item) => (
                <button key={item.id} type="button" data-done={activeStopState.checks[item.id] ? "true" : "false"} onClick={() => toggleCheck(item.id)}>
                  <span className={styles.checkMark}>{activeStopState.checks[item.id] ? "✓" : "○"}</span>
                  <div><strong>{item.label}</strong><small>{item.tier.toUpperCase()} · {item.description}</small></div>
                </button>
              ))}
            </div>
          </article>
          <article className={styles.card}>
            <small>AGENT HANDOFF</small>
            <p>Send only metadata, notes, GPX/audio/proxies and manifests first. RAW masters remain in the two-copy storage pipeline.</p>
            <div className={styles.buttonRow}><button type="button" onClick={() => void copyHandoff()}>Copy handoff</button><button type="button" onClick={() => void shareHandoff()}>Share</button><button type="button" onClick={exportSession}>Export JSON</button></div>
          </article>
        </section>
      )}

      {panel === "relay" && (
        <section className={styles.panelGrid}>
          <article className={styles.primaryCard}>
            <small>FIELD → PRODUCTION RELAY</small>
            <h2>Do the deterministic work while you travel/eat/sleep.</h2>
            <div className={styles.checklist}>
              {plan.relayItems.map((item) => (
                <button key={item.id} type="button" data-done={activeStopState.relay[item.id] ? "true" : "false"} onClick={() => toggleRelay(item.id)}>
                  <span className={styles.checkMark}>{activeStopState.relay[item.id] ? "✓" : "○"}</span>
                  <div><strong>{item.label}</strong><small>{item.description}</small></div>
                </button>
              ))}
            </div>
          </article>
          <article className={styles.card}><small>RULE</small><p>Agents may prepare drafts, QA, indexes, metadata, transcripts and isolated tests. They may not publish, merge, delete masters, invent climbing facts or finalize artistic edits.</p></article>
        </section>
      )}

      {panel === "gaps" && (
        <section className={styles.panelGrid}>
          <article className={styles.primaryCard}>
            <small>BEFORE YOU LEAVE {activeStop.region.toUpperCase()}</small>
            <h2>{requiredMissing ? `${requiredMissing} required item${requiredMissing === 1 ? "" : "s"} still missing.` : "Required capture is complete."}</h2>
            <div className={styles.gapList}>
              {gaps.slice(0, 10).map((item) => (
                <button key={item.id} type="button" data-tier={item.tier} onClick={() => { setPanel("capture"); }}>
                  <span>{item.tier.toUpperCase()}</span><strong>{item.label}</strong><small>{item.description}</small>
                </button>
              ))}
              {!gaps.length && <p>No checklist gaps remain. Use the exit memo to decide whether a return trip is still justified.</p>}
            </div>
          </article>
          <article className={styles.card}>
            <small>CONTRIBUTOR TEST</small>
            <p>Switch deliberately into the public contributor experience for this region, note confusion/offline failures/tap problems, then return here and log a Contributor bug.</p>
            <a className={styles.primaryAction} href={`/contribute?source=field-ops&region=${encodeURIComponent(activeStop.region)}`}>Test as Contributor</a>
          </article>
        </section>
      )}

      {panel === "notes" && (
        <section className={styles.panelGrid}>
          <article className={styles.primaryCard}>
            <small>+ FIELD NOTE</small>
            <h2>{activeStop.region}</h2>
            <div className={styles.categoryRow}>{plan.noteCategories.map((category) => <button key={category} type="button" data-active={noteCategory === category ? "true" : "false"} onClick={() => setNoteCategory(category)}>{category}</button>)}</div>
            <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Speak/type the field truth. Keep uncertainty explicit." rows={5} />
            <div className={styles.buttonRow}><button type="button" className={styles.primaryAction} onClick={() => void addNote()}>Save note</button><button type="button" onClick={() => void captureGps()} disabled={gpsBusy}>Attach/update stop GPS</button></div>
          </article>
          <article className={styles.card}>
            <small>RECENT NOTES</small>
            <div className={styles.notesList}>{[...activeStopState.notes].reverse().map((note) => <div key={note.id}><span>{note.category}</span><p>{note.text}</p><small>{new Date(note.createdAt).toLocaleString()}</small></div>)}</div>
          </article>
        </section>
      )}

      {copyState && <button type="button" className={styles.toast} onClick={() => setCopyState(null)}>{copyState}</button>}

      <footer className={styles.footer}>
        <button type="button" onClick={() => setPanel("notes")}>+ Field note</button>
        <a href={activeStop.mapsUrl} target="_blank" rel="noreferrer">Maps</a>
        <a href={`/contribute?source=field-ops&region=${encodeURIComponent(activeStop.region)}`}>Contributor</a>
        <a href={activeStop.exploreUrl}>Explore</a>
        <button type="button" className={styles.forget} onClick={() => void forgetDevice()}>Forget device</button>
      </footer>
    </main>
  );
}
