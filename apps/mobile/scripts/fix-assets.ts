/**
 * fix-assets.ts
 * Converts fake-PNG (SVG/XML) asset files in apps/mobile/assets/ into real PNGs.
 * Run from apps/mobile: bun run scripts/fix-assets.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const assets = resolve(process.cwd(), "assets");

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];
const isPng = (buf: Buffer): boolean =>
  buf.length >= 4 && PNG_SIG.every((b, i) => buf[i] === b);

// Load sharp (must be installed: bun add -D sharp)
const sharp = (await import("sharp")).default;

// Brand blue background
const BRAND_BG = { r: 14, g: 165, b: 233, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function convertSvgToPng(
  filename: string,
  width: number,
  height: number,
  bgAlpha: number,
  innerFraction = 1.0
): Promise<void> {
  const p = resolve(assets, filename);
  if (!existsSync(p)) {
    console.log(`⏭  ${filename} not found — skipping`);
    return;
  }

  const raw = readFileSync(p);
  if (isPng(raw)) {
    console.log(`✅ ${filename} already a real PNG — no conversion needed`);
    return;
  }

  // Back up SVG
  const svgBackup = p.replace(/\.png$/i, ".svg");
  if (!existsSync(svgBackup)) {
    writeFileSync(svgBackup, raw);
    console.log(`📦 Backed up SVG → ${filename.replace(/\.png$/i, ".svg")}`);
  }

  const bg = bgAlpha === 0 ? TRANSPARENT : BRAND_BG;

  if (innerFraction < 1.0) {
    // Safe-zone adaptive foreground: logo occupies innerFraction of the canvas, centred on transparent bg
    const inner = Math.round(width * innerFraction);
    const logoBuffer = await sharp(raw, { density: 300 })
      .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
      .png()
      .toBuffer();
    await sharp({
      create: { width, height, channels: 4, background: TRANSPARENT },
    })
      .composite([{ input: logoBuffer, gravity: "centre" }])
      .png()
      .toFile(p);
  } else {
    await sharp(raw, { density: 300 })
      .resize(width, height, { fit: "contain", background: bg })
      .flatten(bgAlpha > 0 ? { background: bg } : undefined)
      .png()
      .toFile(p);
  }

  // Verify PNG signature
  const out = readFileSync(p);
  if (!isPng(out)) throw new Error(`❌ ${filename} still NOT a real PNG after conversion!`);
  console.log(`✅ ${filename} → real PNG ${width}x${height}`);
}

// Also generate adaptive-foreground.png (transparent, safe-zone)
async function generateAdaptiveForeground(): Promise<void> {
  const src = resolve(assets, "icon.svg");
  const dest = resolve(assets, "adaptive-foreground.png");
  if (!existsSync(src)) {
    console.warn("⚠️  icon.svg backup not found yet — run after icon.png conversion");
    return;
  }
  const raw = readFileSync(src);
  const inner = Math.round(1024 * 0.66);
  const logoBuffer = await sharp(raw, { density: 300 })
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: TRANSPARENT } })
    .composite([{ input: logoBuffer, gravity: "centre" }])
    .png()
    .toFile(dest);
  const out = readFileSync(dest);
  if (!isPng(out)) throw new Error("❌ adaptive-foreground.png is not a real PNG!");
  console.log("✅ adaptive-foreground.png → real PNG 1024x1024 (transparent safe-zone)");
}

console.log("🔧 Starting asset conversion...\n");

// Convert all three fake PNGs
await convertSvgToPng("icon.png",    1024, 1024, 1);
await convertSvgToPng("favicon.png",   48,   48, 1);
await convertSvgToPng("splash.png",  1284, 2778, 1);

// Generate adaptive foreground (transparent, logo in safe zone)
await generateAdaptiveForeground();

console.log("\n🎉 Asset fix complete.");
