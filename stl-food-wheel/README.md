# St. Louis World Food Wheel

Spin a glossy 3D game-show wheel of the countries represented in the St. Louis dining scene, hear synthesized peg clicks, and get a drawer of verified local restaurants for the winner. Mark countries visited to take them off the wheel.

**Stack:** Vite · React 19 · TypeScript (strict) · Tailwind v4 · three.js + React Three Fiber v9 + drei · zustand · motion · zod · vitest · Web Audio (no audio files)

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173  (add ?debug=1 for the spin-verification overlay)
npm run typecheck
npm test
npm run build
```

## Layout

| Path | What |
| --- | --- |
| `src/types/wheel.ts`, `src/data/schema.ts` | Data contract + matching zod schema |
| `src/data/restaurants.json` | Verified dataset — 32 countries, 81 restaurants (verified 2026-10-17) |
| `src/data/data-report.md` | Sources, every dropped candidate and why, judgment calls |
| `src/store/wheelStore.ts` | zustand store (filters, eliminations, persistence, spin phase) |
| `src/lib/wheelMath.ts` | Pure wheel math; the winner is chosen first, then animated to |
| `src/components/WheelScene.tsx`, `wheel/` | 3D wheel, pegs, flapper, labels, camera (lazy-loaded) |
| `src/components/HudOverlay.tsx`, `hud/` | Responsive HUD: sidebar (desktop) / bottom sheet (mobile) |
| `src/utils/sound.ts` | Procedural tick + win chord |
| `CONTRACTS.md` | Shared contracts between the parts |

## Data freshness

Restaurants open and close constantly. Each entry records `sourceUrl` and `lastVerified`; re-verify anything older than ~90 days before relying on it.

## Credits

Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Wheel label font: Outfit (SIL OFL, see `src/components/wheel/fonts/`).
