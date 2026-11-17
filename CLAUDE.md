# AI Experiments: notes for Claude

Independent side-project apps, one per folder, published together on GitHub Pages at
https://kevinjcroke.github.io/AIExperiments/. The landing page is `site/index.html`.

| Folder | App |
| --- | --- |
| `stl-food-wheel/` | St. Louis World Food Wheel |
| `KravMagaPhysical/` | Red Stripe Ready |
| `ssat-flashcards/` | Upper Hand (SSAT flashcards) |
| `site/` | Landing page (static, everything in it is deployed as-is) |
| `tools/og-image/` | Shared link-preview renderer and the landing page's preview template |

Each app is Vite + React + TypeScript with its own `package.json`, README and tests:
`npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Read the app's README before changing it.

## Deploying

`.github/workflows/pages.yml` runs on every push to `main`: it typechecks, tests and builds each app
with `npx vite build --base=./`, copies `site/` and each app's `dist/` into one site, and deploys it.
Nothing else needs deploying. This container usually can't reach `github.io`, so check a deploy
through the workflow run, not by fetching the live site.

## Every app needs a link-preview image

When an app is shared in Slack, iMessage, X or LinkedIn, the page's Open Graph tags decide the card.
Without them Slack shows an empty gray box. **Every new app gets a preview image and tags as part of
the first version, and an existing app's image is updated when its name, look or headline numbers change.**

1. **Design** `<app>/scripts/og-image/template.html`: a 1200×630 HTML page in the app's own fonts
   and colors. Copy an existing template as a starting point.
   - Put everything that matters (name, headline or hero visual) in the **centre 630×630**. Slack's
     compact card crops the image to that square; the sides only show in full-width cards.
   - Show the real product with real data (real numbers from the app's logic, real content
     word for word). Don't invent stats or features.
   - Load fonts from the app's `node_modules` with relative `url()`s, so the image uses the same
     fonts as the app. Keep text big: the square thumbnail is about 150px wide.
2. **Render** by adding this to the app's `package.json` scripts, then running `npm run og-image`:
   `"og-image": "node ../tools/og-image/render.cjs scripts/og-image/template.html public/og-image.png"`.
   Use `.png` for flat designs and `.jpg` when the card is mostly a photo or 3D render
   (`stl-food-wheel` does this: 160 KB instead of 790 KB). The renderer fails if a font or image
   doesn't load, and prints the path of a preview showing the square thumbnail next to the full
   card. **Look at that preview** before committing.
3. **Tag** `<app>/index.html` by copying the block from an existing app and changing the title,
   description, URL, image name/type and alt text. Every URL must be absolute:
   `https://kevinjcroke.github.io/AIExperiments/<folder>/og-image.png`. Also make sure there's a
   `<meta name="description">`; Slack shows it under the title.
4. **Landing page**: add the app's icon and name to the row in `tools/og-image/site-template.html`
   (the row fits three at the current size; shrink it for more), then re-render:
   `node tools/og-image/render.cjs tools/og-image/site-template.html site/og-image.png`.
   Also re-render it when an app's own preview image changes, since it reuses them.
5. **Check after deploying**: Slack caches the preview for each exact URL, so a link shared before
   the image existed keeps its old card for a while. Test with a new URL such as `.../<folder>/?v=2`.

The renderer needs Playwright with Chromium (`require("playwright")`); it's preinstalled in
Claude Code cloud sessions. `stl-food-wheel/scripts/og-image/capture-wheel.cjs` shows how to put a
capture of a running app (including WebGL) into a template.

## Adding a new app

1. Build it in its own folder with a relative base (Vite `--base=./`).
2. Add its build step and a `cp` into `_site/<folder>` in `.github/workflows/pages.yml`,
   and its lockfile to the workflow's `cache-dependency-path`.
3. Add a card for it in `site/index.html` and a row in the root `README.md`.
4. Give it a link-preview image and tags (above), and update the landing page's image.
