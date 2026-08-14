"use client";

import { useEffect, useRef, useState } from "react";
import { ensureModelViewer } from "../../components/model-viewer-loader";

export function WelcomeReveal() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [orbitDegrees, setOrbitDegrees] = useState(5);
  const [zoomOut, setZoomOut] = useState(false);
  const [showOnLaunch, setShowOnLaunch] = useState(true);
  const closeTimer = useRef<number | null>(null);
  const orbitTimer = useRef<number | null>(null);
  const started = useRef(false);
  const viewer = useRef<HTMLElement>(null);

  function close() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (orbitTimer.current) window.clearInterval(orbitTimer.current);
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 420);
  }

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType || "");
    const preference = localStorage.getItem("vm-show-wall-reveal");
    setShowOnLaunch(preference !== "false");
    if (!reduce && !slow && preference !== "false") {
      setVisible(true);
      ensureModelViewer().catch(() => close());
      const safety = window.setTimeout(close, 6000);
      return () => { window.clearTimeout(safety); if (closeTimer.current) window.clearTimeout(closeTimer.current); if (orbitTimer.current) window.clearInterval(orbitTimer.current); };
    }
  }, []);

  function startReveal() {
    if (started.current) return;
    started.current = true;
    viewer.current?.setAttribute("orientation", "90deg 0deg 0deg");
    const startedAt = performance.now();
    orbitTimer.current = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / 4100);
      setOrbitDegrees(5 + 175 * progress);
      if (progress >= 1 && orbitTimer.current) window.clearInterval(orbitTimer.current);
    }, 60);
    window.setTimeout(() => setZoomOut(true), 4200);
    closeTimer.current = window.setTimeout(close, 6500);
  }

  function updatePreference(next: boolean) {
    setShowOnLaunch(next);
    try { localStorage.setItem("vm-show-wall-reveal", next ? "true" : "false"); } catch {}
  }

  if (!visible) return null;
  return (
    <section className={`wall-reveal ${zoomOut ? "pull-back" : ""} ${leaving ? "leaving" : ""}`} aria-label="Jammerwandl 3D welcome">
      <model-viewer
        ref={viewer}
        src="/models/jammerwandl-web-v1.glb"
        alt="Close-up 3D view of Jammerwandl"
            camera-controls
        interaction-prompt="none"
        camera-orbit={zoomOut ? `${orbitDegrees}deg 72deg 120m` : `${orbitDegrees}deg 72deg 7m`}
        field-of-view={zoomOut ? "48deg" : "24deg"}
        exposure="1"
        shadow-intensity="0.7"
        reveal="auto"
        onLoad={startReveal}
      />
      <div className="reveal-copy"><span>Jammerwandl</span><small>Vertical Moment Collective</small></div>
      <div className="reveal-actions">
        <label><input type="checkbox" checked={showOnLaunch} onChange={e => updatePreference(e.target.checked)} /> Show 3D reveal on launch</label>
        <button type="button" onClick={close}>Skip</button>
      </div>
    </section>
  );
}
