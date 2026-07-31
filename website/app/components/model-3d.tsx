"use client";

import { useEffect, useRef, useState } from "react";

const MODEL_VIEWER_JS = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

function loadModelViewer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (customElements.get("model-viewer")) return resolve();
    const existing = document.querySelector(`script[src="${MODEL_VIEWER_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("model-viewer failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.type = "module";
    s.src = MODEL_VIEWER_JS;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("model-viewer failed to load — check your connection."));
    document.head.appendChild(s);
  });
}

export function Model3D({ glb, alt, webReady, note, height = 320, orientation, cameraOrbit, cameraTarget }: { glb: string; alt: string; webReady: boolean; note?: string; height?: number; orientation?: string; cameraOrbit?: string; cameraTarget?: string }) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadModelViewer().then(() => !cancelled && setReady(true)).catch(e => !cancelled && setErr(e.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (viewer.current && orientation) viewer.current.setAttribute("orientation", orientation);
  }, [orientation, ready]);

  useEffect(() => {
    const sync = () => setFullScreen(document.fullscreenElement === host.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFullScreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.current?.requestFullscreen();
  }

  return (
    <div className={`model3d ${fullScreen ? "is-fullscreen" : ""}`} ref={host}>
      <button className="model-fullscreen" type="button" onClick={toggleFullScreen} aria-label={fullScreen ? "Exit full screen 3D viewer" : "Open 3D viewer full screen"}>
        {fullScreen ? "Exit full screen" : "Full screen"}
      </button>
      {!webReady && (
        <div className="model3d-badge">Photogrammetry preview — not yet optimized for web</div>
      )}
      {err ? (
        <div className="muted" style={{ padding: 16 }}>{err}</div>
      ) : ready ? (
        <model-viewer
          ref={viewer}
          src={glb}
          alt={alt}
          camera-controls
          exposure="1"
          shadow-intensity="0.6"
          loading="lazy"
          reveal="auto"
          camera-orbit={cameraOrbit}
          camera-target={cameraTarget}
          style={{ width: "100%", height: fullScreen ? "calc(100vh - 42px)" : height, background: "var(--surface-strong)", borderRadius: 14 }}
        />
      ) : (
        <div className="muted" style={{ padding: 16 }}>Loading 3D viewer…</div>
      )}
      {note && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{note}</p>}
    </div>
  );
}
