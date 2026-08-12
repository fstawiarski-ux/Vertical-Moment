"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { searchEntries, type SearchEntry } from "../../core/searchIndex";
import styles from "./CommandPalette.module.css";

const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  module: "Module",
  region: "Region",
  crag: "Crag",
  sector: "Sector",
  action: "Action",
};

export function CommandPalette({ open, entries, initialQuery = "", onClose, onSelect, onCopyLink }: {
  open: boolean;
  entries: SearchEntry[];
  /** Seeded when the palette is opened from a breadcrumb level. */
  initialQuery?: string;
  onClose: () => void;
  onSelect: (entry: SearchEntry) => void;
  /** Cmd/Ctrl+Enter copies a module's deep link instead of opening it. */
  onCopyLink: (entry: SearchEntry) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const results = useMemo(() => searchEntries(query, entries), [entries, query]);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setHighlight(0);
    setNotice(null);
    // The palette mounts hidden, so focus has to wait for the paint that shows it.
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialQuery, open]);

  useEffect(() => {
    setHighlight((current) => (current < results.length ? current : 0));
  }, [results.length]);

  if (!open) return null;

  const choose = (entry: SearchEntry | undefined, copy: boolean) => {
    if (!entry) return;
    if (copy) {
      onCopyLink(entry);
      setNotice(entry.boxId ? `Link to ${entry.label} copied` : "Only modules and places have links");
      return;
    }
    onSelect(entry);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown" || (event.key === "n" && event.ctrlKey)) {
      event.preventDefault();
      setHighlight((current) => (results.length === 0 ? 0 : (current + 1) % results.length));
      return;
    }
    if (event.key === "ArrowUp" || (event.key === "p" && event.ctrlKey)) {
      event.preventDefault();
      setHighlight((current) => (results.length === 0 ? 0 : (current - 1 + results.length) % results.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      choose(results[highlight], event.metaKey || event.ctrlKey);
    }
  };

  return (
    <div className={styles.scrim} role="presentation" onPointerDown={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search the Climbers Lounge"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.field}>
          <span className={styles.prompt} aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[highlight] ? `${listId}-${highlight}` : undefined}
            aria-label="Search crags, sectors, modules and commands"
            placeholder="Search crags, sectors, modules, commands…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setNotice(null); }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className={styles.dismiss} onClick={onClose}>Esc</button>
        </div>

        <ul className={styles.results} id={listId} role="listbox" aria-label="Search results">
          {results.map((entry, index) => (
            <li key={entry.id}>
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === highlight}
                data-active={index === highlight ? "true" : "false"}
                onPointerEnter={() => setHighlight(index)}
                onClick={(event) => choose(entry, event.metaKey || event.ctrlKey)}
              >
                <span className={styles.kind}>{KIND_LABEL[entry.kind]}</span>
                <span className={styles.label}>{entry.label}</span>
                <span className={styles.detail}>{entry.detail}</span>
                {entry.shortcut && <kbd>{entry.shortcut}</kbd>}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className={styles.empty}>Nothing matches “{query.trim()}”.</li>
          )}
        </ul>

        <p className={styles.hint} aria-live="polite">
          {notice ?? "↑ ↓ to move · Enter to open · Ctrl/⌘ + Enter to copy a link"}
        </p>
      </div>
    </div>
  );
}
