// Copies database/api/v1 (generated, never hand-edited) into
// website/public/data/v1 so the SAME files are reachable both at build time
// (fs, for generateStaticParams) and at runtime (fetch, for the client map).
// This does not transform or duplicate the dataset — it's a verbatim copy
// so one generated tree can serve two consumers. Run before dev/build.
import { cp, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "database", "api", "v1");
const dest = path.resolve(here, "..", "public", "data", "v1");

async function main() {
  try {
    await stat(src);
  } catch {
    console.error(`sync-data: source not found at ${src}`);
    console.error("Run 'python database/scripts/build_api.py' first.");
    process.exit(1);
  }
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, { recursive: true });
  console.log(`sync-data: ${src} -> ${dest}`);
}

main();
