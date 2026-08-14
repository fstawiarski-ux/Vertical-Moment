"use client";

import { useEffect, useState } from "react";
import styles from "./ConnectionStatus.module.css";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const updateNetworkState = () => setOnline(navigator.onLine);
    const onUpdate = () => setUpdateReady(true);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    window.addEventListener("vm:sw-update-available", onUpdate);
    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
      window.removeEventListener("vm:sw-update-available", onUpdate);
    };
  }, []);

  if (online && !updateReady) return null;

  return (
    <div className={styles.status} role="status" aria-live="polite">
      {!online && <span>Offline · cached route data + media only</span>}
      {updateReady && (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("vm:sw-apply-update"));
            window.setTimeout(() => window.location.reload(), 500);
          }}
        >
          Update ready · Reload
        </button>
      )}
    </div>
  );
}
