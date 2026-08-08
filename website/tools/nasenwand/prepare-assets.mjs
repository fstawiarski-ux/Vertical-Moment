import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const DEFAULT_WIDTHS = [1280, 2400];

function readArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith('--')) continue;
    values.set(entry.slice(2), argv[index + 1]);
    index += 1;
  }
  return {
    photo: values.get('photo'),
    topo: values.get('topo'),
    out: values.get('out'),
    prefix: values.get('prefix') ?? 'nasenwand',
  };
}

function requireValue(value, name) {
  if (!value) {
    throw new Error(`Missing --${name}. See tools/nasenwand/README.md for the expected command.`);
  }
  return path.resolve(value);
}

async function sha256(filePath) {
  const source = await readFile(filePath);
  return createHash('sha256').update(source).digest('hex');
}

function requirePrefix(value) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error('Invalid --prefix. Use lowercase letters, numbers, and hyphens only.');
  }
  return value;
}

async function preparePhoto(photoPath, outputDir, prefix, width) {
  const destination = path.join(outputDir, `${prefix}-photo-${width}.webp`);
  await sharp(photoPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: width >= 2000 ? 82 : 78, effort: 6, smartSubsample: true })
    .toFile(destination);
  return destination;
}

async function prepareSpatialRelief(photoPath, outputDir, prefix, width) {
  const destination = path.join(outputDir, `${prefix}-spatial-${width}.webp`);
  await sharp(photoPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .greyscale()
    .normalise({ lower: 1, upper: 99 })
    .gamma(1.35)
    .sharpen({ sigma: 1.1 })
    .tint({ r: 82, g: 105, b: 96 })
    .modulate({ brightness: 0.68 })
    .webp({ quality: width >= 2000 ? 82 : 78, effort: 6, smartSubsample: true })
    .toFile(destination);
  return destination;
}

async function prepareTopo(topoPath, outputDir, prefix, width) {
  const destination = path.join(outputDir, `${prefix}-topo-${width}.webp`);
  await sharp(topoPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: width >= 2000 ? 84 : 80, effort: 6, smartSubsample: true })
    .toFile(destination);
  return destination;
}

function routeAlpha(red, green, blue) {
  const separation = blue - Math.max(red, green);
  const blueLine = blue > 68 && separation > 22 && blue > red * 1.35 && blue > green * 1.18;
  if (!blueLine) return 0;
  return Math.max(88, Math.min(255, Math.round(separation * 3.2)));
}

async function extractRouteOverlay(topoPath) {
  const { data, info } = await sharp(topoPath).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(info.width * info.height * 4);
  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const offset = pixel * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = routeAlpha(red, green, blue);
    output[offset] = 217;
    output[offset + 1] = 164;
    output[offset + 2] = 69;
    output[offset + 3] = alpha;
  }
  return { data: output, info };
}

async function prepareRouteOverlay(routeOverlay, outputDir, prefix, width) {
  const destination = path.join(outputDir, `${prefix}-routes-${width}.png`);
  await sharp(routeOverlay.data, {
    raw: {
      width: routeOverlay.info.width,
      height: routeOverlay.info.height,
      channels: 4,
    },
  })
    .median(3)
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, colours: 128 })
    .toFile(destination);
  return destination;
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  const photoPath = requireValue(args.photo, 'photo');
  const topoPath = requireValue(args.topo, 'topo');
  const outputDir = requireValue(args.out, 'out');
  const prefix = requirePrefix(args.prefix);
  await mkdir(outputDir, { recursive: true });

  const [photoMetadata, topoMetadata, photoHash, topoHash, routeOverlay] = await Promise.all([
    sharp(photoPath).metadata(),
    sharp(topoPath).metadata(),
    sha256(photoPath),
    sha256(topoPath),
    extractRouteOverlay(topoPath),
  ]);

  const generated = [];
  for (const width of DEFAULT_WIDTHS) {
    generated.push(
      ...(await Promise.all([
        preparePhoto(photoPath, outputDir, prefix, width),
        prepareSpatialRelief(photoPath, outputDir, prefix, width),
        prepareTopo(topoPath, outputDir, prefix, width),
        prepareRouteOverlay(routeOverlay, outputDir, prefix, width),
      ])),
    );
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    prefix,
    source: {
      photo: {
        filename: path.basename(photoPath),
        width: photoMetadata.width,
        height: photoMetadata.height,
        sha256: photoHash,
      },
      topo: {
        filename: path.basename(topoPath),
        width: topoMetadata.width,
        height: topoMetadata.height,
        sha256: topoHash,
      },
    },
    derivatives: generated.map((filePath) => path.basename(filePath)),
    status: 'prototype-derived; route geometry requires human or field verification before publication',
  };
  await writeFile(path.join(outputDir, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
