import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "..", "..", "database", "api", "v1");
const mirror = path.resolve(here, "..", "public", "data", "v1");

async function filesUnder(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).replaceAll(path.sep, "/"));
  }
  return files.sort();
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

const [sourceFiles, mirrorFiles] = await Promise.all([filesUnder(source), filesUnder(mirror)]);
const sourceSet = new Set(sourceFiles);
const mirrorSet = new Set(mirrorFiles);
const missing = sourceFiles.filter((file) => !mirrorSet.has(file));
const extra = mirrorFiles.filter((file) => !sourceSet.has(file));
const mismatches = [];

for (const file of sourceFiles) {
  if (!mirrorSet.has(file)) continue;
  const [sourceHash, mirrorHash] = await Promise.all([
    sha256(path.join(source, file)),
    sha256(path.join(mirror, file)),
  ]);
  if (sourceHash !== mirrorHash) mismatches.push(file);
}

console.log(`verify-data: source ${sourceFiles.length} files; mirror ${mirrorFiles.length} files`);
if (missing.length) console.error(`verify-data: missing mirror files: ${missing.join(", ")}`);
if (extra.length) console.error(`verify-data: extra mirror files: ${extra.join(", ")}`);
if (mismatches.length) console.error(`verify-data: content mismatches: ${mismatches.join(", ")}`);

if (missing.length || extra.length || mismatches.length) {
  process.exitCode = 1;
} else {
  console.log("verify-data: canonical API and website mirror are byte-identical");
}
