// Renders template.html to public/og-image.png (1200x630), the link-preview image.
// Needs Playwright with Chromium and the app's npm deps (for the fonts):
//   npm ci && node scripts/og-image/render.cjs
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

(async () => {
  const template = path.join(__dirname, "template.html");
  const out = path.join(__dirname, "..", "..", "public", "og-image.png");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(template).href);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    ["800 20px 'Barlow Condensed'", "italic 800 20px 'Barlow Condensed'", "700 20px 'Barlow Condensed'", "400 20px Inter"].filter((f) => !document.fonts.check(f)),
  );
  if (missing.length) throw new Error(`Fonts not loaded (run npm ci first): ${missing.join(", ")}`);
  await page.screenshot({ path: out, type: "png" });
  await browser.close();
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
})();
