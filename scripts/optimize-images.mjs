#!/usr/bin/env node
/**
 * Downscales everything in public/images to fit inside MAX x MAX and re-encodes
 * as JPEG. The site is a static export (output: "export", images.unoptimized),
 * so there is no server-side optimizer - the files on disk are what ships.
 *
 * Idempotent: images already within bounds are left alone, so it is safe to
 * re-run after adding new artwork.
 *
 *   node scripts/optimize-images.mjs [--max 400] [--quality 80] [--dry]
 */
import { readdir, stat, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'public/images');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
const MAX = flag('max', 400);
const QUALITY = flag('quality', 80);
const DRY = args.includes('--dry');

const kb = b => `${(b / 1024).toFixed(0)}KB`;

const files = (await readdir(DIR)).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
if (!files.length) {
  console.log('no images found in public/images');
  process.exit(0);
}

let before = 0, after = 0, resized = 0, skipped = 0;

for (const file of files.sort()) {
  const src = path.join(DIR, file);
  const size = (await stat(src)).size;
  before += size;

  const image = sharp(src, { failOn: 'none' });
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    console.log(`skip ${file} (unreadable)`);
    after += size;
    skipped++;
    continue;
  }

  if (meta.width <= MAX && meta.height <= MAX) {
    after += size;
    skipped++;
    continue;
  }

  if (DRY) {
    console.log(`would resize ${file}  ${meta.width}x${meta.height} -> fit ${MAX}  (${kb(size)})`);
    after += size;
    resized++;
    continue;
  }

  // Write beside the original, then swap, so a failure can't truncate the source.
  const tmp = path.join(DIR, `.${file}.tmp.jpg`);
  await image
    .rotate() // honour EXIF orientation before we drop the metadata
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp);

  const newSize = (await stat(tmp)).size;
  if (newSize >= size) {
    // Already smaller than what we'd produce; keep the original.
    await unlink(tmp);
    after += size;
    skipped++;
    continue;
  }

  await rename(tmp, src);
  after += newSize;
  resized++;
  const out = await sharp(src).metadata();
  console.log(`${file.padEnd(44)} ${meta.width}x${meta.height} -> ${out.width}x${out.height}  ${kb(size)} -> ${kb(newSize)}`);
}

console.log(`\n${resized} resized, ${skipped} left as-is`);
console.log(`${kb(before)} -> ${kb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`);
if (DRY) console.log('(dry run - nothing written)');
