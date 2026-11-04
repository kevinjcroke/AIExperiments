# Red Stripe Ready

Plan the Krav Maga red-stripe physical test (one-mile run, push-ups, squats, plank). Each event is scored 0-100 from the school's charts, and the test score is the average of the four. Lock in what you can actually do, and the events left on **Auto** rebalance to show the least you need in each to hit your rank's required average. Everything is saved in the browser (localStorage).

**Stack:** Vite · React 19 · TypeScript (strict) · Tailwind v4 · zustand (persist) · motion · vitest

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
npm run charts     # regenerate src/data/charts.json from requirements/*.xlsx (Python 3, stdlib only)
```

## Layout

| Path | What |
| --- | --- |
| `requirements/*.xlsx` | The school's scoring spreadsheets (source of truth) |
| `scripts/convert_charts.py` | Converts the spreadsheets to JSON, validates them, and prints a summary |
| `src/data/charts.json` | Generated charts: `values[p]` = threshold for `p` points, per event / gender / age bracket |
| `src/lib/model.ts` | Fixed rules: events, ranks and required %, outcomes (pass / conditional / retest) |
| `src/lib/charts.ts` | Picks the right chart for an age and gender |
| `src/lib/scoring.ts` | Scoring, the rebalancing planner (`solve`), and the +/- step logic (`nudge`) |
| `src/store/plannerStore.ts` | Profile and locked values, persisted and sanitised on load |
| `src/lib/useRebalanceFeedback.ts` | Tracks which Auto events moved ("5 pts easier" chips) and the screen-reader announcement |
| `src/components/`, `src/index.css` | UI only, ported from the Claude Design canvas. Design tokens live in the `@theme` block |
| `design-prompt.md`, `design-canvas/` | The Claude Design prompt and the canvas it produced (reference only; not built) |

## How the planner works

- The required total is `4 × required%` (for example 300 points for Blue/Brown at 75%).
- **Locked** events keep the user's raw value (a time or a rep count) and are re-scored if the profile changes.
- **Auto** events split the remaining points as evenly as possible (integer water-filling, bounded by each chart's floor and 100). Each one then shows the least effort that earns its share: the fewest reps, the slowest run time, or the shortest hold.
- Changing an event (slider, +/-, or typing) locks it. Tapping the tag sends it back to Auto.
- When the plan is impossible, `impossibleFix` finds the smallest change to the weakest locked event that brings a full pass back (the "Set mile to 10:40" button).
- States: `balanced`, `covered` (locked events already carry the test, so Auto events sit at their floor), `impossible` (even 100 in every Auto event falls short), and `calculator` (everything is locked).

## Chart quirks (carried over from the spreadsheets as-is)

- Mile and plank times are typed as Excel `h:mm` but mean `m:ss` ("6:40" is stored as 6 h 40 min). The converter handles this.
- Age headers `<25` / `26-30` and `<30` / `31-35` leave 25 and 30 ambiguous. `<N` is treated as "N and under".
- The 26-30 push-up and squat columns are slightly harder than `<25` (for example 77 vs 75 men's push-ups for 100 points).
- Push-up and squat charts list negative reps in their low rows, so **0 reps still scores** the chart's floor. For example, men 51+ get 47 push-up points for 0 reps.
- The plank chart stops at 0:00 = 48 points.
- All charts are linear: 1 rep = 1 point, 4 seconds of mile = 1 point, 5 seconds of plank = 1 point. Scores round down between rows (an 8:41 mile scores like 8:44), and each event caps at 100.
