"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { BoxState, ExploreContentBox, ExploreContentRegistry } from "../../core/types";
import type { ResolvedWorkspaceManifest } from "../../core/workspaceManifest";
import styles from "../../ExploreApp.module.css";

type PhonePreviewVariant = "baseline" | "refined" | "minimal" | "improved" | "improved-minimal" | "minimal-fixed";

function resolvePhonePreview(): PhonePreviewVariant {
  if (typeof window === "undefined") return "baseline";
  const requested = new URLSearchParams(window.location.search).get("phonePreview");
  return requested === "refined"
    || requested === "minimal"
    || requested === "improved"
    || requested === "improved-minimal"
    || requested === "minimal-fixed"
    ? requested
    : "baseline";
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
  onToggleJourney,
  followJourney,
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
  onToggleJourney: () => void;
  followJourney: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [phonePreview, setPhonePreview] = useState<PhonePreviewVariant>("baseline");
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
  const minimalFixed = phonePreview === "minimal-fixed";

  const openContent = (id: string) => {
    setMoreOpen(false);
    onOpenBox(id);
  };

  return (
    <section className={styles.phoneShell} data-shell="phone" data-phone-preview={phonePreview} data-active-box={selected?.id ?? "none"} data-single-active={workspace.phone.singleActive ? "true" : "false"} aria-label="Phone Explore workspace">
      <header className={styles.phoneHeader}>
        {!minimalFixed && (
          <>
            <div>
              <small>Field workspace</small>
              <strong>{selectedContent?.title ?? "Explore"}</strong>
            </div>
            <button type="button" onClick={onSearch} aria-label="Search commands, boxes, regions, routes, and options" title="Global search">⌕</button>
          </>
        )}
      </header>
      <p className={styles.phoneHint}>
        {followJourney && stationContent ? `${stationContent.region} · ${stationContent.crag}` : "One focused task at a time"}
      </p>
      <div className={styles.phoneStage} data-active-box={selected?.id ?? "none"}>
        {selected ? renderBox(selected) : <p>Choose a workspace below.</p>}
      </div>
      <nav className={styles.phoneNav} aria-label="Phone workspace navigation">
        <button type="button" aria-pressed={followJourney} onClick={onToggleJourney}>Journey</button>
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
        {minimalFixed && (
          <button type="button" onClick={onSearch} aria-label="Search commands, boxes, regions, routes, and options" title="Global search">⌕</button>
        )}
      </nav>
      {moreOpen && (
        <div className={styles.phoneMoreMenu} id="phone-more-menu" aria-label="More workspace destinations">
          {additional.map((content) => (
            <button key={content.id} type="button" aria-current={content.id === selected?.id ? "page" : undefined} onClick={() => openContent(content.id)}>
              {content.title}
            </button>
          ))}
          <button type="button" onClick={() => { setMoreOpen(false); onContribute(); }}>Add contribution</button>
          {fieldOpsAvailable && (
            <button type="button" onClick={() => window.location.assign("/explore-app/field")}>Field Ops · private</button>
          )}
        </div>
      )}
    </section>
  );
}
