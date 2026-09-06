// Image/file helpers: replaces the PIL/cv2 based utilities from the Python backend.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

export function ensureDirs() {
  for (const d of ['tmp', 'images/src', 'images/thumbnail', 'images/boxes', 'images/segs', 'tmp_segment_map']) {
    fs.mkdirSync(d, { recursive: true });
  }
}

// Save image buffer as webp src + thumbnail, returns relative paths.
export async function saveImageFiles(id, input) {
  const src = `images/src/${id}.webp`;
  const thumbnail = `images/thumbnail/${id}.webp`;
  const img = sharp(input, { failOn: 'none' });
  await img.clone().webp({ quality: 80 }).toFile(src);
  await img.clone().resize({
    width: 200, height: 200, fit: 'inside', withoutEnlargement: true,
  }).webp({ quality: 100 }).toFile(thumbnail);
  return { src, thumbnail };
}

// Save video file + first-frame thumbnail (via bundled ffmpeg), returns relative paths.
export async function saveVideoFiles(id, videoPath) {
  const filename = path.basename(videoPath);
  const src = `images/src/${filename}`;
  const thumbnail = `images/thumbnail/${id}.webp`;
  fs.copyFileSync(videoPath, src);
  const framePath = `tmp/${id}_frame.png`;
  execFileSync(ffmpegPath, ['-y', '-i', src, '-frames:v', '1', framePath], { stdio: 'pipe' });
  await sharp(framePath).webp().toFile(thumbnail);
  fs.rmSync(framePath, { force: true });
  return { src, thumbnail };
}

// Crop box region with aspect-preserving downscale (used for detection box thumbnails).
export async function cropBoxImage(srcPath, box, outPath, maxDimension = 150) {
  const { x1, y1, x2, y2 } = box;
  const width = Math.max(1, x2 - x1);
  const height = Math.max(1, y2 - y1);
  let newWidth, newHeight;
  if (width > height) {
    newWidth = Math.min(maxDimension, width);
    newHeight = Math.min(Math.round(newWidth / (width / height)), maxDimension);
  } else {
    newHeight = Math.min(maxDimension, height);
    newWidth = Math.min(Math.round(newHeight * (width / height)), maxDimension);
  }
  await sharp(srcPath)
    .extract({ left: x1, top: y1, width, height })
    .resize(newWidth, newHeight)
    .toFile(outPath);
}

// Cut original image by mask (white = keep), returns RGBA buffer same size as mask.
export async function cropImageWithMask(originalPath, maskPath, left, top) {
  const maskImg = sharp(maskPath).greyscale();
  const { width: maskW, height: maskH } = await maskImg.metadata();
  const maskRaw = await maskImg.raw().toBuffer();
  const regionRaw = await sharp(originalPath)
    .extract({ left, top, width: maskW, height: maskH })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const out = Buffer.alloc(maskW * maskH * 4);
  for (let i = 0; i < maskW * maskH; i++) {
    if (maskRaw[i] >= 128) {
      out[i * 4] = regionRaw[i * 4];
      out[i * 4 + 1] = regionRaw[i * 4 + 1];
      out[i * 4 + 2] = regionRaw[i * 4 + 2];
      out[i * 4 + 3] = regionRaw[i * 4 + 3];
    }
  }
  return sharp(out, { raw: { width: maskW, height: maskH, channels: 4 } }).png().toBuffer();
}

// Downscale/compress image to <= maxSizeKb JPEG base64 (for cloud APIs).
export async function optimizeImageForApi(imagePath, { maxSizeKb = 512, maxDimension = 1024, header = true } = {}) {
  let img = sharp(imagePath).flatten().resize({
    width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true,
  });
  let quality = 85;
  let buf;
  for (;;) {
    buf = await img.clone().jpeg({ quality }).toBuffer();
    if (buf.length <= maxSizeKb * 1024 || quality <= 50) break;
    quality -= 5;
  }
  const encoded = buf.toString('base64');
  return header ? `data:image/jpeg;base64,${encoded}` : encoded;
}

export function fileToB64(p) {
  return fs.readFileSync(p).toString('base64');
}

export function b64ToFile(b64, p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, Buffer.from(b64, 'base64'));
  return p;
}
