# AI Experiments

A collection of independent side-project experiments. Each lives in its own folder with its own README and tooling.

**Live site:** https://kevinjcroke.github.io/AIExperiments/ (deployed by `.github/workflows/pages.yml` on every push to `main`; the landing page is `site/index.html`).

| Experiment | Description |
| --- | --- |
| [`stl-food-wheel/`](stl-food-wheel/) | St. Louis World Food Wheel — spin a 3D game-show wheel of countries and get verified local restaurants for the winner. [Play it](https://kevinjcroke.github.io/AIExperiments/stl-food-wheel/) |

## Adding an experiment to the site

1. Build it into its own folder with a relative base (e.g. Vite `--base=./`).
2. Add a build step and a `cp` into `_site/<folder>` in `.github/workflows/pages.yml`.
3. Add a card for it in `site/index.html`.
