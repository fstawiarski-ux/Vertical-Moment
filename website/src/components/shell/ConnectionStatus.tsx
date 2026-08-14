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
      {!online && <span>Offline · saved Explore content only</span>}
      {updateReady && (
        <button type="button" onClick={() => window.location.reload()}>
          Update ready · Reload
        </button>
      )}
    </div>
  );
}
