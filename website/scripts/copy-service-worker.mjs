import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const source = path.resolve("public/sw.js");
const assetsDirectory = path.resolve(".open-next/assets");
const destination = path.join(assetsDirectory, "sw.js");

await stat(source);
await mkdir(assetsDirectory, { recursive: true });
await copyFile(source, destination);

console.log(`copy-service-worker: ${source} -> ${destination}`);
