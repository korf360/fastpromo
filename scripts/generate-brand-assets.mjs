import sharp from "sharp";
import fs from "fs";

const src = "public/discord/bot-icon-f-diamond.png";

// Full square source → branded assets
const full = sharp(src).ensureAlpha();

await full
  .clone()
  .resize(512, 512)
  .png()
  .toFile("public/brand-icon.png");

await full
  .clone()
  .resize(512, 512)
  .png()
  .toFile("public/brand-logo.png");

// Favicon / apple: slight center crop so the F+diamond fills the tab icon
const meta = await sharp(src).metadata();
const w = meta.width ?? 1024;
const h = meta.height ?? 1024;
const crop = Math.floor(Math.min(w, h) * 0.72);
const left = Math.floor((w - crop) / 2);
const top = Math.floor((h - crop) / 2 - h * 0.04); // bias up toward diamond

const mark = await sharp(src)
  .extract({
    left,
    top: Math.max(0, top),
    width: crop,
    height: Math.min(crop, h - Math.max(0, top)),
  })
  .resize(512, 512, { fit: "cover" })
  .png()
  .toBuffer();

await sharp(mark).resize(32, 32).png().toFile("src/app/icon.png");
await sharp(mark).resize(48, 48).png().toFile("src/app/icon-48.png");
await sharp(mark).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp(mark).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(mark).resize(512, 512).png().toFile("public/icon-512.png");

// Also write ICO-friendly 32px as favicon.ico via png (Next uses icon.png)
const logoNav = await sharp(mark).resize(128, 128).png().toBuffer();
fs.writeFileSync("public/brand-mark.png", logoNav);

console.log({
  icon: fs.statSync("src/app/icon.png").size,
  apple: fs.statSync("src/app/apple-icon.png").size,
  brand: fs.statSync("public/brand-icon.png").size,
  mark: fs.statSync("public/brand-mark.png").size,
});
