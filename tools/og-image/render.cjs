#!/usr/bin/env node
// Renders a link-preview template (a 1200x630 HTML page) to an image, then writes a preview of how
// it shows when shared: a 150px square centre crop (Slack's compact card) next to the full card.
//
//   node tools/og-image/render.cjs <template.html> <out.png|out.jpg>
//
// Use .png for flat designs and .jpg when the card holds a photo or 3D render (much smaller).
// Fails if a font or image in the template doesn't load, so a missing `npm ci` can't silently
// produce an image in fallback fonts. Needs Playwright with Chromium (`require("playwright")`).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const [templateArg, outArg] = process.argv.slice(2);
if (!templateArg || !outArg) {
  console.error("Usage: node tools/og-image/render.cjs <template.html> <out.png|out.jpg>");
  process.exit(2);
}
const template = path.resolve(templateArg);
const out = path.resolve(outArg);
const jpeg = /\.jpe?g$/i.test(out);
const W = 1200;
const H = 630;

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(template).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    });
    const problems = await page.evaluate(() => [
      ...[...document.fonts].filter((f) => f.status === "error").map((f) => `font ${f.family} ${f.weight} ${f.style}`),
      ...[...document.images].filter((img) => !img.naturalWidth).map((img) => `image ${img.getAttribute("src")}`),
    ]);
    if (problems.length) throw new Error(`Didn't load (run npm ci in the app?):\n  ${problems.join("\n  ")}`);

    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, ...(jpeg ? { type: "jpeg", quality: 88 } : { type: "png" }) });

    // Preview: square centre crop as Slack shows it, plus the full card.
    const src = `data:image/${jpeg ? "jpeg" : "png"};base64,${fs.readFileSync(out).toString("base64")}`;
    const preview = await browser.newPage({ viewport: { width: 860, height: 380 }, deviceScaleFactor: 2 });
    await preview.setContent(`<body style="margin:0;padding:20px;display:flex;gap:20px;align-items:flex-start;background:#1a1d21">
      <div style="width:150px;height:150px;flex:none;border-radius:10px;background:url(${src}) center/cover"></div>
      <img src="${src}" style="width:650px;border-radius:8px"></body>`);
    const previewPath = path.join(os.tmpdir(), `og-preview-${path.basename(path.dirname(path.dirname(out)))}-${path.basename(out)}`);
    await preview.screenshot({ path: previewPath, fullPage: true });

    console.log(`Wrote ${path.relative(process.cwd(), out)} (${W}x${H}, ${Math.round(fs.statSync(out).size / 1024)} KB)`);
    console.log(`Preview (square thumbnail + full card): ${previewPath}`);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
