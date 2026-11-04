import { EVENT_IDS, EVENTS, type EventId } from "../lib/model";
import type { Plan } from "../lib/scoring";

const TOTAL = EVENT_IDS.length * 100;
const HATCH = "repeating-linear-gradient(135deg, #43d9f5 0 6px, #2bb3cc 6px 12px)";
/** Bars use 82% of the plot height for 100 points, leaving room for the labels on top. */
const BAR_SCALE = 0.82;

/** The 400-point budget, then the four events as bars against the required line: the seesaw. */
export function PointsSplit({ plan, moved }: { plan: Plan; moved: Partial<Record<EventId, number>> }) {
  const req = plan.required;
  const summary = `Points split. ${EVENT_IDS.map((id) => `${EVENTS[id].short} ${plan.events[id].points} (${plan.events[id].locked ? "locked" : "auto"})`).join(", ")}. Total ${plan.totalPoints} of ${TOTAL}; ${plan.requiredTotal} needed.`;

  return (
    <section aria-label="Points split" className="flex flex-col gap-3.5 rounded-md border border-line bg-panel px-4 pt-4 pb-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-[0.14em] uppercase">Points split</h2>
        <p className="flex items-baseline gap-1.5 font-display tabular">
          <span className="text-[26px] font-extrabold">{plan.totalPoints}</span>
          <span className="text-base font-semibold tracking-[0.06em] text-ink-3 uppercase">
            / {TOTAL} &middot; need {plan.requiredTotal}
          </span>
        </p>
      </div>

      <p className="sr-only">{summary}</p>

      {/* the budget: one bar of 400 */}
      <div aria-hidden="true" className="relative h-[34px]">
        <div className="absolute inset-x-0 top-2 flex h-3.5 gap-0.5 overflow-hidden rounded-xs bg-control">
          {EVENT_IDS.map((id) => {
            const e = plan.events[id];
            return (
              <div
                key={id}
                className="bar-spring h-full flex-none"
                style={{ width: `calc(${(e.points / TOTAL) * 100}% - 2px)`, background: e.locked ? "var(--color-locked)" : HATCH }}
              />
            );
          })}
        </div>
        <div className="absolute top-0.5 -ml-[1.5px] h-[26px] w-[3px] rounded-[2px] bg-stripe-hot" style={{ left: `${(plan.requiredTotal / TOTAL) * 100}%` }} />
        <span
          className="absolute top-[22px] -translate-x-1/2 font-display text-[11px] font-bold tracking-[0.08em] text-stripe-text"
          style={{ left: `${(plan.requiredTotal / TOTAL) * 100}%` }}
        >
          {plan.requiredTotal}
        </span>
      </div>

      {/* four bars against the required line */}
      <div
        aria-hidden="true"
        className="relative grid h-[150px] grid-cols-4 gap-3 border-b border-line pr-[30px] pl-0.5"
        style={{ backgroundImage: "linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px)", backgroundSize: "100% 25%" }}
      >
        {EVENT_IDS.map((id) => {
          const e = plan.events[id];
          const h = `${Math.max(0, Math.min(100, e.points)) * BAR_SCALE}%`;
          return (
            <div key={id} className="relative flex h-full flex-col items-center justify-end">
              <span
                className={`bar-spring absolute z-[2] rounded-xs bg-panel px-[5px] py-px font-display text-xl leading-none font-extrabold tabular ${e.locked ? "text-ink" : "text-auto-text"}`}
                style={{ bottom: `calc(${h} + 5px)` }}
              >
                {e.points}
              </span>
              <div
                className="bar-spring relative w-full max-w-[54px] overflow-hidden rounded-t-[6px] rounded-b-[2px]"
                style={{
                  height: h,
                  background: e.locked ? "var(--color-locked)" : HATCH,
                  boxShadow: e.locked ? "none" : "0 0 18px -4px rgb(67 217 245 / 0.6)",
                }}
              >
                {moved[id] ? <span key={`${id}-${moved[id]}`} className="wash" /> : null}
              </div>
            </div>
          );
        })}
        <div className="absolute right-0 -left-1 z-[1] border-t-2 border-dashed border-stripe-hot" style={{ bottom: `${req * BAR_SCALE}%` }} />
        <span
          className="absolute right-0 z-[1] rounded-[3px] bg-stripe px-[5px] py-px font-display text-[11px] font-bold tracking-[0.08em] text-white"
          style={{ bottom: `calc(${req * BAR_SCALE}% - 9px)` }}
        >
          {req}
        </span>
      </div>

      <div aria-hidden="true" className="-mt-1 grid grid-cols-4 gap-3 pr-[30px] pl-0.5">
        {EVENT_IDS.map((id) => {
          const e = plan.events[id];
          const diff = e.points - req;
          return (
            <div key={id} className="flex min-w-0 flex-col items-center gap-[3px]">
              <span className="font-display text-[13px] font-bold tracking-[0.1em] whitespace-nowrap text-ink-2 uppercase">{EVENTS[id].short}</span>
              <span className={`font-display text-sm font-bold tabular ${diff > 0 ? "text-pass" : diff < 0 ? "text-conditional" : "text-ink-2"}`}>
                {diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : "on the line"}
              </span>
              <span className={`font-display text-[11px] font-bold tracking-[0.12em] uppercase ${e.locked ? "text-ink-2" : "text-auto"}`}>
                {e.locked ? "Locked" : "Auto"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs leading-[17px] text-pretty text-ink-3">
        Above the red line pays for below it. Every point over {req} in one event is a point another event doesn&rsquo;t need.
      </p>
    </section>
  );
}
