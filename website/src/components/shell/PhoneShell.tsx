"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { BoxState, ExploreContentBox, ExploreContentRegistry } from "../../core/types";
import type { ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import styles from "../../ExploreApp.module.css";

type PhonePreviewVariant = "baseline" | "refined" | "minimal" | "improved" | "improved-minimal" | "minimal-fixed" | "hero-first";

function resolvePhonePreview(): PhonePreviewVariant {
  if (typeof window === "undefined") return "hero-first";
  const requested = new URLSearchParams(window.location.search).get("phonePreview");
  return requested === "baseline"
    || requested === "refined"
    || requested === "minimal"
    || requested === "improved"
    || requested === "improved-minimal"
    || requested === "minimal-fixed"
    || requested === "hero-first"
    ? requested
    : "hero-first";
}

export function PhoneShell({
  registry,
  workspace,
  boxes,
  activeBoxId,
  stationContent,
  renderBox,
  onOpenBox,
  onSearch,
  onContribute,
  onReplayJourney,
}: {
  registry: ExploreContentRegistry;
  workspace: ResolvedWorkspaceManifest;
  boxes: BoxState[];
  activeBoxId: string | null;
  stationContent: ExploreContentBox | null;
  renderBox: (box: BoxState) => ReactNode;
  onOpenBox: (id: string) => void;
  onSearch: () => void;
  onContribute: () => void;
  onReplayJourney: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [phonePreview, setPhonePreview] = useState<PhonePreviewVariant>("hero-first");
  const [fieldOpsAvailable, setFieldOpsAvailable] = useState(false);

  useEffect(() => {
    setPhonePreview(resolvePhonePreview());
  }, []);

  useEffect(() => {
    const syncFieldOps = () => {
      try {
        setFieldOpsAvailable(window.localStorage.getItem("vm-field-ops-authorized") === "1");
      } catch {
        setFieldOpsAvailable(false);
      }
    };
    syncFieldOps();
    window.addEventListener("storage", syncFieldOps);
    window.addEventListener("vm:field-ops-auth", syncFieldOps);
    return () => {
      window.removeEventListener("storage", syncFieldOps);
      window.removeEventListener("vm:field-ops-auth", syncFieldOps);
    };
  }, []);

  const selected = boxes.find((box) => box.id === activeBoxId && box.mode !== "minimized")
    ?? boxes.find((box) => box.mode !== "minimized")
    ?? boxes[0];
  const selectedContent = selected
    ? registry.boxes.find((content) => content.id === selected.id) ?? stationContent
    : stationContent;
  const primary = workspace.phone.primaryModuleIds
    .map((id) => registry.boxes.find((content) => content.id === id))
    .filter((content): content is ExploreContentBox => Boolean(content));
  const primaryIds = new Set(workspace.phone.primaryModuleIds);
  const additional = registry.boxes.filter((content) => !primaryIds.has(content.id));

  const openContent = (id: string) => {
    setMoreOpen(false);
    onOpenBox(id);
  };

  return (
    <section
      className={styles.phoneShell}
      data-shell="phone"
      data-phone-preview={phonePreview}
      data-active-box={selected?.id ?? "none"}
      data-single-active={workspace.phone.singleActive ? "true" : "false"}
      aria-label="Phone Explore workspace"
    >
      <header className={styles.phoneHeader} aria-hidden="true">
        <div><small>Hero-first workspace</small><strong>{selectedContent?.title ?? "Explore"}</strong></div>
      </header>
      <p className={styles.phoneHint}>Hero first · tools expand on request</p>

      <div className={styles.phoneStage} data-role="phone-stage" data-active-box={selected?.id ?? "none"}>
        {selected ? renderBox(selected) : <p>Choose a workspace module.</p>}
      </div>

      <nav className={styles.phoneNav} data-role="phone-nav" aria-label="Phone workspace navigation">
        {primary.map((content) => (
          <button
            key={content.id}
            type="button"
            aria-current={content.id === selected?.id ? "page" : undefined}
            onClick={() => openContent(content.id)}
          >
            {content.mobileLabel ?? content.title}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="phone-more-menu"
          onClick={() => setMoreOpen((value) => !value)}
        >
          Modules
        </button>
        <button type="button" onClick={onSearch} aria-label="Search the Explore workspace">Search</button>
      </nav>

      {moreOpen && (
        <div className={styles.phoneMoreMenu} data-role="phone-more" id="phone-more-menu" aria-label="More workspace destinations">
          {additional.map((content) => (
            <button key={content.id} type="button" aria-current={content.id === selected?.id ? "page" : undefined} onClick={() => openContent(content.id)}>
              {content.title}
            </button>
          ))}
          <button type="button" aria-label="Replay the Region to Topo journey" onClick={() => { setMoreOpen(false); onReplayJourney(); }}>Replay Journey</button>
          <button type="button" onClick={() => { setMoreOpen(false); onContribute(); }}>Add contribution</button>
          {fieldOpsAvailable && (
            <button type="button" onClick={() => window.location.assign("/explore-app/field")}>Field Ops · private</button>
          )}
        </div>
      )}
    </section>
  );
}
