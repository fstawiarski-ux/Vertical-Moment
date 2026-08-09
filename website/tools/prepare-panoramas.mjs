import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = process.argv[2];
const outputDirectory = process.argv[3] ?? path.resolve('public/photography/panoramas/wachau');

if (!sourceDirectory) {
  throw new Error('Usage: node tools/prepare-panoramas.mjs <source-directory> [output-directory]');
}

// Trims remove only visible stitch-canvas edges from web derivatives. The
// supplied PNG masters are never modified or copied into the public website.
const sources = [
  { id: 'wachau-07', file: '7.png', previewWidth: 2400 },
  // The primary regional experience displays this unusually wide frame at
  // full viewport height. A 5200px derivative keeps its details legible while
  // remaining far smaller than the private PNG master.
  { id: 'wachau-09', file: '9.png', previewWidth: 5200, trim: { bottom: 40 } },
  { id: 'wachau-10', file: '10.png', trim: { top: 76, bottom: 56 } },
  { id: 'wachau-11', file: '11.png', previewWidth: 2600 },
  { id: 'wachau-12', file: '12.png', trim: { bottom: 35 } },
  { id: 'wachau-13', file: '13.png', previewWidth: 2800, trim: { bottom: 28 } },
  { id: 'wachau-14', file: '14.png', previewWidth: 3000 },
  { id: 'wachau-15', file: '15.png', previewWidth: 2400, trim: { bottom: 112 } },
  { id: 'wachau-16', file: '16.png', trim: { bottom: 30 } },
];

await mkdir(outputDirectory, { recursive: true });

const manifest = [];

for (const source of sources) {
  const inputPath = path.join(sourceDirectory, source.file);
  const input = await readFile(inputPath);
  const metadata = await sharp(input).metadata();
  const left = source.trim?.left ?? 0;
  const top = source.trim?.top ?? 0;
  const right = source.trim?.right ?? 0;
  const bottom = source.trim?.bottom ?? 0;
  const width = (metadata.width ?? 0) - left - right;
  const height = (metadata.height ?? 0) - top - bottom;
  const base = sharp(input).rotate().extract({ left, top, width, height });
  const previewName = `${source.id}-preview.webp`;
  const thumbName = `${source.id}-thumb.webp`;

  const preview = await base
    .clone()
    .resize({ width: source.previewWidth ?? 3200, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 74, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  await Promise.all([
    writeFile(path.join(outputDirectory, previewName), preview.data),
    writeFile(path.join(outputDirectory, thumbName), thumb.data),
  ]);

  manifest.push({
    id: source.id,
    sourceFile: source.file,
    sourceSha256: createHash('sha256').update(input).digest('hex'),
    sourcePixels: `${metadata.width}x${metadata.height}`,
    webCrop: { left, top, right, bottom },
    preview: { file: previewName, width: preview.info.width, height: preview.info.height, bytes: preview.info.size },
    thumbnail: { file: thumbName, width: thumb.info.width, height: thumb.info.height, bytes: thumb.info.size },
  });
}

await writeFile(
  path.join(outputDirectory, 'manifest.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), policy: 'web-derivatives-only', items: manifest }, null, 2)}\n`,
);

const previewBytes = manifest.reduce((total, item) => total + item.preview.bytes, 0);
const thumbnailBytes = manifest.reduce((total, item) => total + item.thumbnail.bytes, 0);
console.log(`Prepared ${manifest.length} panoramas: ${previewBytes} preview bytes + ${thumbnailBytes} thumbnail bytes.`);
