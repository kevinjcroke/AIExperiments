# Phase 1 contracts (locked)

Shared files — **do not edit in Phase 2**; report back if a change is needed:

| File | Contract |
| --- | --- |
| `src/types/wheel.ts` | Data types (`Restaurant`, `CountryNode`, `WheelDataset`, enums + `DINING_STYLES` / `PRICE_RANGES` arrays) |
| `src/data/schema.ts` | zod schema mirroring the types (compile-time equality check). Lat/lng bounded to the STL metro. |
| `src/store/wheelStore.ts` | zustand store. Use `useWheelStore(selector)` and `useActiveCountries()` (memoised, dataset-ordered). Helpers: `matchingRestaurants`, `countryById`. |
| `src/lib/wheelMath.ts` | Pure wheel math + `planSpin` (winner first) + `nearestRotationFor` (direct selection) + `easeOutQuart`. |
| `src/lib/debug.ts` | Mutable `debugState` WheelScene writes for the `?debug=1` overlay. |
| `src/lib/useMediaQuery.ts` | `useIsDesktop()` (≥ 768 px), `usePrefersReducedMotion()`, `prefersReducedMotion()`. |
| `src/components/FlagIcon.tsx` | `<FlagIcon code="ba" className? title? />` — DOM flag. Never flag emoji. |
| `src/data/index.ts` | Exports `dataset` (fixture now, `restaurants.json` in Phase 3). |
| `src/App.tsx` | `<HudOverlay stage={<WheelScene />} />`, syncs `muted` → `setMuted`. |

## Store semantics
- `requestSpin()` sets `phase: "spinning"`, clears `selectedId`, increments `spinRequestId` (no-op while spinning or with 0 active countries).
- WheelScene reacts to `spinRequestId`, and on completion calls `setPhase("settled")` then `select(winnerId)`.
- `select(id)` ignores ids not on the wheel. `eliminate` / `setFilters` null out `selectedId` / `pointerId` that fall off the wheel.
- `setFilters` is ignored while spinning.

## Component props
- `WheelScene` — default export, no props.
- `HudOverlay({ stage })` — owns the responsive layout (desktop sidebar / mobile bottom sheet), readout pill, Spin, filters, eliminated list, toasts, Space shortcut, and calls `unlockAudio()` on the first spin gesture.
- `RestaurantDrawer({ country, onClose, onMarkVisited })` — drawer *content*; HudOverlay chooses the container.

## Three.js utilities
- `getFlagTexture(iso): THREE.CanvasTexture` — synchronous, cached per ISO for app lifetime (sets `needsUpdate` when the SVG loads). WheelScene must not dispose these.
- `sound.ts` — `unlockAudio`, `playTick`, `playWin`, `setMuted`.
