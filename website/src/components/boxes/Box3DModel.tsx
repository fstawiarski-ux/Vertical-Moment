"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { ExploreImageAsset, ExploreModelAsset } from "../../core/types";
import styles from "./Box3DModel.module.css";

type ModelProgressEvent = CustomEvent<{ totalProgress?: number }>;

export function Box3DModel({
  model,
  poster,
  isActive,
  intentOnly = false,
  label = "climbing wall",
}: {
  model: ExploreModelAsset;
  poster?: ExploreImageAsset;
  isActive: boolean;
  /** Keep heavy geometry behind an explicit user action in focused previews. */
  intentOnly?: boolean;
  /** Human-readable crag name used by accessible copy and load errors. */
  label?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [requested, setRequested] = useState(false);
  const [moduleReady, setModuleReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const shouldLoad = requested || (!intentOnly && isActive && visible);
  const modelSize = `${(model.bytes / (1024 * 1024)).toFixed(1)} MiB`;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || moduleReady) return;
    let cancelled = false;
    const decoderPath = "/vendor/model-viewer/draco/";
    const viewerGlobal = globalThis as typeof globalThis & { ModelViewerElement?: { dracoDecoderLocation?: string } };
    if (viewerGlobal.ModelViewerElement) viewerGlobal.ModelViewerElement.dracoDecoderLocation = decoderPath;
    else viewerGlobal.ModelViewerElement = { dracoDecoderLocation: decoderPath };
    import("@google/model-viewer")
      .then(({ ModelViewerElement }) => {
        ModelViewerElement.dracoDecoderLocation = decoderPath;
        const registeredViewer = customElements.get("model-viewer") as typeof ModelViewerElement | undefined;
        if (registeredViewer) registeredViewer.dracoDecoderLocation = decoderPath;
        if (!cancelled) setModuleReady(true);
      })
      .catch(() => { if (!cancelled) setError("The 3D viewer could not start."); });
    return () => { cancelled = true; };
  }, [moduleReady, shouldLoad]);

  useEffect(() => {
    const node = modelRef.current;
    if (!node || !moduleReady) return;
    const onLoad = () => { setLoaded(true); setProgress(1); };
    const onError = () => setError(`The ${label} model could not be loaded.`);
    const onProgress = (event: Event) => setProgress((event as ModelProgressEvent).detail?.totalProgress ?? 0);
    node.addEventListener("load", onLoad);
    node.addEventListener("error", onError);
    node.addEventListener("progress", onProgress);
    node.setAttribute("src", model.src);
    if (poster) node.setAttribute("poster", poster.src);
    node.setAttribute("alt", `Provisional 3D model of ${label}`);
    node.setAttribute("camera-controls", "");
    node.setAttribute("touch-action", "pan-y");
    node.setAttribute("shadow-intensity", "1");
    node.setAttribute("environment-image", "neutral");
    node.setAttribute("interaction-prompt", "auto");
    node.setAttribute("loading", "eager");
    node.setAttribute("reveal", "auto");
    return () => {
      node.removeEventListener("load", onLoad);
      node.removeEventListener("error", onError);
      node.removeEventListener("progress", onProgress);
    };
  }, [label, model.src, moduleReady, poster]);

  return (
    <div ref={rootRef} className={styles.viewer}>
      {!moduleReady && poster && <img src={poster.src} alt={poster.alt} className={styles.poster} />}
      {!shouldLoad && (
        <div className={styles.gate}>
          <span>{modelSize} · cached after first use</span>
          <button type="button" onClick={() => setRequested(true)}>Load interactive 3D</button>
        </div>
      )}
      {shouldLoad && !moduleReady && !error && <div className={styles.status}>Loading viewer…</div>}
      {moduleReady && !error && createElement("model-viewer", {
        ref: (node: HTMLElement | null) => { modelRef.current = node; },
        src: model.src,
        poster: poster?.src,
        alt: `Provisional 3D model of ${label}`,
        "camera-controls": true,
        "touch-action": "pan-y",
        "shadow-intensity": "1",
        "environment-image": "neutral",
        "interaction-prompt": "auto",
        loading: "eager",
        reveal: "auto",
        className: styles.model,
      })}
      {moduleReady && !loaded && !error && (
        <div className={styles.status}>Loading model… {Math.round(progress * 100)}%</div>
      )}
      {error && <div className={styles.error}><strong>3D unavailable</strong><span>{error}</span><button type="button" onClick={() => location.reload()}>Retry</button></div>}
      {loaded && <span className={styles.hint}>Drag to orbit · pinch to zoom · two-finger pan</span>}
    </div>
  );
}
