// Captures the real 3D wheel from the built app to wheel.jpg, which template.html uses.
// Only needed when the wheel's look changes:
//   npx vite build && node scripts/og-image/capture-wheel.cjs && npm run og-image
// Needs Playwright with Chromium; WebGL runs on SwiftShader, so no GPU is required.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const appDir = path.join(__dirname, "..", "..");
const out = path.join(__dirname, "wheel.jpg");

(async () => {
  if (!fs.existsSync(path.join(appDir, "dist", "index.html"))) throw new Error("No dist/. Run `npx vite build` first.");
  const { preview } = await import("vite");
  const server = await preview({ root: appDir, logLevel: "silent", preview: { port: 4399, strictPort: false } });
  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await page.goto(url);
    const canvas = page.locator("canvas").first();
    await canvas.waitFor();
    await page.waitForTimeout(3000); // flags and labels stream in after the first frame
    // Hide the HUD (title, filters, chip, SPIN) but keep the 3D canvas.
    await page.addStyleTag({ content: "#root * { visibility: hidden !important } #root canvas { visibility: visible !important }" });
    await page.waitForTimeout(300);
    const box = await canvas.boundingBox();
    const side = Math.round(Math.min(box.width, box.height) * 0.76);
    const clip = { x: box.x + box.width / 2 - side / 2, y: box.y + box.height / 2 - side / 2 - 6, width: side, height: side };
    await page.screenshot({ path: out, type: "jpeg", quality: 90, clip });
    console.log(`Wrote ${path.relative(process.cwd(), out)} (${side * 2}px square)`);
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
