let modelViewerPromise: Promise<void> | null = null;

/** Load the pinned, bundled web component once a 3D surface is actually used. */
export function ensureModelViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("3D viewer is browser-only"));
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (!modelViewerPromise) {
    modelViewerPromise = import("@google/model-viewer")
      .then(() => {
        if (!customElements.get("model-viewer")) throw new Error("3D viewer unavailable");
      })
      .catch((error) => {
        modelViewerPromise = null;
        throw error;
      });
  }
  return modelViewerPromise;
}
