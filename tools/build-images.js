/**
 * Generates the raster assets that platforms will not accept as SVG:
 * the Open Graph card, the Apple touch icon and the maskable PWA icon.
 *
 * Run once via `npm run images`; output is committed so a deploy never
 * depends on native binaries being available on the build machine.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "src/assets/img");

const mark = (size, r) => `
  <rect width="${size}" height="${size}" rx="${r}" fill="#14508c"/>
  <path d="M${size * 0.25} ${size * 0.688}V${size * 0.313}l${size * 0.25} ${size * 0.219}
           ${size * 0.25} -${size * 0.219}v${size * 0.375}"
        fill="none" stroke="#fff" stroke-width="${size * 0.082}"
        stroke-linecap="round" stroke-linejoin="round"/>`;

const icon = (size, r) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
        viewBox="0 0 ${size} ${size}">${mark(size, r)}</svg>`;

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#14304f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="90" r="260" fill="#1c4b7d" opacity="0.35"/>
  <g transform="translate(80,84)">
    <rect width="72" height="72" rx="16" fill="#2b7fd4"/>
    <path d="M18 50V22l18 16 18-16v28" fill="none" stroke="#fff" stroke-width="6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <text x="92" y="50" font-family="Segoe UI, Helvetica, Arial, sans-serif"
          font-size="38" font-weight="700" fill="#ffffff">Meridian</text>
  </g>
  <text x="80" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="66" font-weight="700" fill="#ffffff">Audits should be a report,</text>
  <text x="80" y="378" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="66" font-weight="700" fill="#ffffff">not a project.</text>
  <text x="80" y="452" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="30" fill="#9fc4e8">Continuous compliance for engineering teams</text>
  <rect x="80" y="520" width="220" height="6" rx="3" fill="#2b7fd4"/>
  <text x="80" y="580" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="26" fill="#7f95b3">SOC 2 &#183; ISO 27001 &#183; HIPAA &#183; GDPR</text>
</svg>`;

await fs.mkdir(OUT, { recursive: true });

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(path.join(OUT, "og.png"));
await sharp(Buffer.from(icon(180, 40))).png().toFile(path.join(OUT, "apple-touch-icon.png"));
await sharp(Buffer.from(icon(512, 112))).png().toFile(path.join(OUT, "icon-512.png"));

console.log("Wrote og.png, apple-touch-icon.png, icon-512.png");
