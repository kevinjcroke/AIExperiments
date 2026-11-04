# Prompt for Claude Design

Paste everything below the line into Claude Design.

---

Design a mobile-first web app called **Red Stripe Ready**. It helps Krav Maga students plan for the physical test they must pass at each red-stripe belt test. It should look impressive: athletic, high-energy, a little cinematic. Think fight-night broadcast graphics meets a premium fitness tracker, not a generic SaaS dashboard.

## Who uses it and where

Adult students (roughly 18 to 65+), mostly on their phones: at the gym, before a run, or on the couch planning their training. Some will use a laptop. No accounts and no sign-in. Everything is saved on the device and is there next time they open the app.

## How the test works (these rules are fixed; do not invent others)

The test has four events, always in this order:

1. **One-mile run.** Time, m:ss. Lower is better.
2. **Push-ups.** Reps in 2 minutes.
3. **Squats.** Reps in 2 minutes.
4. **Plank.** Hold time, m:ss. Higher is better.

Each event gets a score from 0 to 100 using the school's charts. The run and push-ups depend on age and gender, squats on age only, and the plank is the same for everyone. The overall score is the **average of the four**, so a weak event can be made up by a strong one.

The required average depends on the rank you are testing at:

| Testing at | Required average |
| --- | --- |
| Green/Blue Belt | 65% |
| Blue Belt | 70% |
| Blue/Brown Belt | 75% |
| Brown Belt | 80% |

There are three possible outcomes:

- **Pass.** The average meets or beats the requirement.
- **Conditional pass.** The average is no more than 5 points below the requirement. You still get the red stripe, but you retest at your first stripe test at the next rank.
- **Retest in one month.** The average is more than 5 points below the requirement.

## The core idea: a points budget that rebalances

Passing at 75% means earning 300 of 400 possible points. The user can split those points across the four events however they like. The app's main job is to show that split and let them play with it.

- **Profile:** age, gender, and the rank they are testing for. Keep it compact and easy to change, because changing it re-scores everything.
- **Four event cards.** Each one shows the raw value (for example "52 reps" or "8:20") and its score (for example "75 pts"), plus a control to change the value: a slider, +/- steppers, and tap-to-type. Time entry uses m:ss. On every slider, moving right means better performance, so the mile slider gets faster as you move right. Label it clearly.
- **Auto vs Locked.** Each event is either **Auto** or **Locked**.
  - An **Auto** event shows what you *need*. The app sets it so the average lands exactly on the requirement.
  - A **Locked** event holds *your* number.
  - Changing an event locks it. A single tap on the lock unlocks it.
  - When you lock or change an event, the Auto events instantly rebalance. Do more push-ups and your required squats, run time, and plank go down.
  - These two states must look clearly different. Auto should feel "live" and computed, for example a glow, a pulsing outline, or an "AUTO" tag. Locked should feel solid and set.
  - The rebalance is the hero moment. Animate it: numbers roll, bars spring to their new length, and the cards that moved get a brief highlight.
- **Overall score hero.** Show a large gauge or ring with the average (for example "75.25%"), a marker at the required %, and a visible band for the 5-point conditional-pass zone below it. Add an outcome badge (Pass / Conditional pass / Retest in one month) and a points readout such as "301 / 300 pts needed".
- **Points split visual.** Show how the 400-point total is divided across the four events, such as a stacked bar or four bars against the required line. This is where people *see* the seesaw.

## States to design

1. **First visit.** Ask for age, gender, and testing rank in one quick, friendly step. After that, all four events are Auto with equal shares (75 / 75 / 75 / 75 at Blue/Brown).
2. **Some events locked.** The Auto events show what's needed.
3. **All four locked.** The app becomes a plain score calculator showing the user's result and outcome.
4. **Impossible.** Even maxing every Auto event can't reach the requirement. Show the best possible average and which locked event is costing the most. Keep the tone encouraging, not scolding.
5. **Already covered.** The locked events alone carry the requirement, so the Auto events drop to the chart minimum. Celebrate it.
6. **Reference view.** A clean, readable lookup of the user's own scoring chart (value ↔ points for their age and gender). The school's original spreadsheets are hard to read, so this is a real selling point. A bottom sheet or a secondary tab works.
7. **Settings and reset.** Edit the profile, "Unlock all", and "Reset everything".

## Example data (use these real numbers in the mockups)

A 22-year-old man testing at Blue/Brown (needs 75%):

| Event | Value | Score |
| --- | --- | --- |
| Mile | 8:40 | 70 |
| Push-ups | 55 | 80 |
| Squats | 74 | 76 |
| Plank | 2:15 | 75 |
| **Average** | | **75.25% → Pass** |

The same person on first visit (all Auto): mile 8:20 (75), push-ups 50 (75), squats 73 (75), plank 2:15 (75).

The same person with push-ups locked at 65 (90 pts) and the mile locked at 8:40 (70 pts): Auto squats become 68 reps (70 pts) and Auto plank becomes 1:50 (70 pts).

Scoring is linear. In this profile, 1 push-up or 1 squat = 1 point, 4 seconds of mile time = 1 point, and 5 seconds of plank = 1 point. Each event is capped at 100.

## Visual direction

- Dark theme by default. A deep charcoal or near-black canvas with high-contrast type.
- Use belt colors as the accent system: green, blue, brown, and a signature **red stripe** accent for primary actions and the "required" marker. Use the current rank's belt colors in the header.
- Typography: a bold, condensed athletic display face for numbers and headings, and a clean sans for body text. Numbers are the stars, so make them big and tabular.
- Texture: subtle (fabric or belt weave, diagonal stripe motifs, a faint mat grid). Keep it tasteful, never noisy.
- Motion: springy and quick (150–350 ms). Honor reduced-motion by swapping to fades.
- Don't use any real school's logo or name. Use the "Red Stripe Ready" wordmark.

## Accessibility and practical constraints

- WCAG AA contrast, 44 px minimum touch targets, and visible focus states.
- Sliders work with the keyboard and announce full values, for example "Mile, 8 minutes 40 seconds, 70 points, locked".
- Never rely on color alone for Auto/Locked or pass/fail. Pair color with an icon and text.
- Design at 390 px wide (phone) and 1440 px (desktop). On desktop, put the four events in a row or a 2×2 grid next to the score hero.

## Deliverables

High-fidelity screens for the states above, at phone and desktop sizes, plus the components (event card in Auto/Locked/editing states, score gauge, outcome badge, points-split bar, profile picker, reference table) and design tokens (colors, type scale, spacing, radii, motion). The scoring and rebalancing logic is already built in React + TypeScript + Tailwind v4, so focus on the UI layer and keep the structure easy to hand off to Claude Code.
