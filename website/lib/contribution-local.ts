import { createStore, del, get, set } from "idb-keyval";
import { strToU8, zipSync } from "fflate";

export type EvidenceKind = "photo" | "gpx" | "pdf" | "file";

export type LocalEvidenceFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: EvidenceKind;
  caption: string;
  blob: Blob;
  lastModified: number;
};

let contributionStore: ReturnType<typeof createStore> | null = null;

function getContributionStore() {
  if (typeof indexedDB === "undefined") {
    throw new Error("Offline contribution storage is unavailable in this browser.");
  }
  contributionStore ??= createStore("vertical-moment-contributions", "drafts-v1");
  return contributionStore;
}

export async function readContributionDraft<T>(key: string): Promise<T | null> {
  const value = await get<T>(key, getContributionStore());
  return value ?? null;
}

export async function writeContributionDraft<T>(key: string, value: T): Promise<void> {
  await set(key, value, getContributionStore());
}

export async function removeContributionDraft(key: string): Promise<void> {
  await del(key, getContributionStore());
}

export function evidenceKind(file: File): EvidenceKind {
  if (/\.gpx$/i.test(file.name)) return "gpx";
  if (/\.pdf$/i.test(file.name)) return "pdf";
  if (file.type.startsWith("image/")) return "photo";
  return "file";
}

export function storeEvidenceFile(file: File): LocalEvidenceFile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    kind: evidenceKind(file),
    caption: "",
    blob: file,
    lastModified: file.lastModified,
  };
}

export function safeArchiveName(name: string): string {
  const normalized = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "evidence-file";
}

export async function createContributionArchive(
  manifest: Record<string, unknown>,
  files: LocalEvidenceFile[],
): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {
    "manifest.json": strToU8(`${JSON.stringify(manifest, null, 2)}\n`),
  };

  for (const [index, file] of files.entries()) {
    const prefix = String(index + 1).padStart(2, "0");
    entries[`evidence/${prefix}-${safeArchiveName(file.name)}`] = new Uint8Array(await file.blob.arrayBuffer());
  }

  const zipped = zipSync(entries, { level: 6 });
  const bytes = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
  return new Blob([bytes], { type: "application/zip" });
}

export async function downloadContributionArchive(
  filename: string,
  manifest: Record<string, unknown>,
  files: LocalEvidenceFile[],
): Promise<void> {
  const archive = await createContributionArchive(manifest, files);
  const url = URL.createObjectURL(archive);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
