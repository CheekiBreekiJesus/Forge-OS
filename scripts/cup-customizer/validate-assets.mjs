#!/usr/bin/env node
/**
 * Deterministic Cup Customizer asset validation.
 * Usage: node scripts/cup-customizer/validate-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd(), "public/assets/cup-customizer");

const ASSETS = [
  { label: "cup 250ml", file: "cups/reusable-pp/250ml.png", expectTransparency: true },
  { label: "cup 330ml", file: "cups/reusable-pp/330ml.png", expectTransparency: true },
  { label: "cup 430ml", file: "cups/reusable-pp/430ml.png", expectTransparency: true },
  { label: "cup 500ml", file: "cups/reusable-pp/500ml.png", expectTransparency: true },
  { label: "scene day", file: "backgrounds/day.png", expectTransparency: false },
  { label: "scene night", file: "backgrounds/night.png", expectTransparency: false }
];

async function inspectAsset({ label, file, expectTransparency }) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    return { label, file, ok: false, error: "missing file" };
  }

  const metadata = await sharp(fullPath).metadata();
  const { data, info } = await sharp(fullPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let transparent = 0;
  let semi = 0;
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha === 0) transparent += 1;
    else if (alpha < 255) semi += 1;
  }

  const totalPixels = data.length / 4;
  const transparentPct = (transparent / totalPixels) * 100;
  const hasRealTransparency = metadata.hasAlpha === true && transparentPct > 1;
  const bakedBackground = !hasRealTransparency && expectTransparency;

  const corners = [
    0,
    info.width - 1,
    (info.height - 1) * info.width,
    (info.height - 1) * info.width + info.width - 1
  ];
  const cornerAlpha = corners.map((index) => data[index * 4 + 3]);

  return {
    label,
    file,
    ok: true,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: metadata.hasAlpha === true,
    aspectRatio: Number((metadata.width / metadata.height).toFixed(4)),
    transparentPct: Number(transparentPct.toFixed(2)),
    semiTransparentPct: Number(((semi / totalPixels) * 100).toFixed(2)),
    hasRealTransparency,
    bakedBackgroundSuspected: bakedBackground,
    cornerAlpha,
    decodable: true
  };
}

const results = [];
let exitCode = 0;

for (const asset of ASSETS) {
  try {
    const result = await inspectAsset(asset);
    results.push(result);
    if (!result.ok || result.bakedBackgroundSuspected) {
      exitCode = 1;
    }
  } catch (error) {
    results.push({
      label: asset.label,
      file: asset.file,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
    exitCode = 1;
  }
}

console.log(JSON.stringify({ root: ROOT, results }, null, 2));
process.exit(exitCode);
