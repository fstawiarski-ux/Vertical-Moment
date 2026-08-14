"use client";

import { useEffect, useRef, useState } from "react";
import { ensureModelViewer } from "../../components/model-viewer-loader";

export function Model3D({ glb, alt, webReady, note, height = 320, orientation, cameraOrbit, cameraTarget }: { glb: string; alt: string; webReady: boolean; note?: string; height?: number; orientation?: string; cameraOrbit?: string; cameraTarget?: string }) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    ensureModelViewer().then(() => !cancelled && setReady(true)).catch(e => !cancelled && setErr(e.message));
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
