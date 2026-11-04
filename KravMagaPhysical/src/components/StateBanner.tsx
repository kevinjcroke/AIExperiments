import { Lock, Zap } from "lucide-react";
import { formatTime, formatValue } from "../lib/format";
import { EVENT_IDS, EVENTS, type EventId } from "../lib/model";
import { impossibleFix, type Plan } from "../lib/scoring";

function list(ids: EventId[]): string {
  const names = ids.map((id) => EVENTS[id].short);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const label = "font-display text-[13px] font-bold tracking-[0.18em] uppercase";
const headline = "m-0 font-display font-extrabold italic leading-none uppercase text-ink";
const body = "m-0 text-sm leading-5 text-pretty text-body";
const solidBtn =
  "btn h-12 flex-[1_1_160px] rounded-sm bg-stripe px-4 font-display text-[17px] font-extrabold tracking-[0.08em] text-white uppercase";
const ghostBtn =
  "btn h-12 flex-[1_1_140px] rounded-sm border border-locked bg-transparent px-4 font-display text-[17px] font-bold tracking-[0.08em] uppercase";

/** The panel under the gauge: what mode the planner is in and what to do about it. */
export function StateBanner({
  plan,
  onSet,
  onUnlock,
  onUnlockAll,
}: {
  plan: Plan;
  onSet: (event: EventId, value: number) => void;
  onUnlock: (event: EventId) => void;
  onUnlockAll: () => void;
}) {
  const req = plan.required;
  const autoIds = EVENT_IDS.filter((id) => !plan.events[id].locked);
  const diff = plan.totalPoints - plan.requiredTotal;

  if (plan.status === "balanced") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-auto/35 bg-auto-bg p-3.5">
        <Zap className="mt-px size-5 flex-none fill-auto text-auto" aria-hidden="true" />
        <p className={body}>
          <strong className="text-auto-text">Auto events are set so you land exactly on {req}%.</strong> Lock in a number you know you can hit and the rest
          rebalance.
        </p>
      </div>
    );
  }

  if (plan.status === "calculator") {
    const line =
      plan.outcome === "pass"
        ? diff === 0
          ? `You land exactly on ${req}%.`
          : `You clear ${req}% by ${diff} ${diff === 1 ? "pt" : "pts"}.`
        : plan.outcome === "conditional"
          ? `${-diff} pts short of ${req}%, which is a conditional pass.`
          : `${-diff} pts short of ${req}%. Retest in one month.`;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line-strong bg-[#16181c] p-3.5">
        <Lock className="size-5 flex-none text-locked" strokeWidth={2.4} aria-hidden="true" />
        <p className={`${body} flex-[1_1_200px]`}>
          <strong className="text-ink">All four are your numbers.</strong> {line}
        </p>
        <button
          type="button"
          onClick={onUnlockAll}
          className="btn h-11 rounded-sm border border-locked bg-transparent px-4 font-display text-[15px] font-bold tracking-[0.1em] uppercase"
        >
          Unlock all
        </button>
      </div>
    );
  }

  if (plan.status === "covered") {
    return (
      <div className="relative flex flex-col gap-2 overflow-hidden rounded-[16px] border border-pass/55 bg-[#0d1a12] px-4 pt-5 pb-[18px]">
        <div aria-hidden="true" className="burst pointer-events-none absolute -top-[30px] -right-[30px] size-[190px]">
          <span className="absolute top-1/2 left-1/2 -mt-[3px] -ml-[60px] h-1.5 w-[120px] -rotate-[35deg] bg-stripe" />
          <span className="absolute top-1/2 left-1/2 -mt-[1.5px] -ml-[75px] h-[3px] w-[150px] rotate-[10deg] bg-ink opacity-70" />
          <span className="absolute top-1/2 left-1/2 -mt-[2.5px] -ml-[55px] h-[5px] w-[110px] rotate-[55deg] bg-pass" />
          <span className="absolute top-1/2 left-1/2 -mt-[1.5px] -ml-[45px] h-[3px] w-[90px] -rotate-[80deg] bg-auto opacity-80" />
          <span className="absolute top-1/2 left-1/2 -mt-[23px] -ml-[23px] size-[46px] rounded-full border-[3px] border-pass" />
        </div>
        <span className={`relative ${label} text-pass`}>Already covered</span>
        <h2 className={`relative ${headline} text-[34px]`}>You&rsquo;re covered.</h2>
        <p className={`relative ${body} max-w-[300px]`}>
          Your locked numbers already clear {req}%, even with {list(autoIds).toLowerCase()} at the chart minimum. Anything more is a bonus.
        </p>
        <span className="relative mt-1 inline-flex items-baseline gap-1.5 self-start rounded-full bg-pass/15 px-3 py-1.5 font-display text-xl font-extrabold tracking-[0.04em] text-pass uppercase">
          <span>+{diff}</span>
          <span className="text-sm font-bold tracking-[0.1em]">pts to spare</span>
        </span>
      </div>
    );
  }

  // impossible
  const fix = impossibleFix(plan);
  const fixCopy = (() => {
    if (!fix) return "";
    const meta = EVENTS[fix.event];
    const current = plan.events[fix.event].value;
    if (fix.targetValue === null) {
      return `Even 100 on ${meta.short.toLowerCase()} wouldn’t close it alone. Unlock it and let the app spread the work across more events.`;
    }
    const gap = Math.abs(fix.targetValue - current);
    if (fix.event === "mile") return `Shave ${formatTime(gap)} off your mile (${formatTime(fix.targetValue)}) and a full pass is back in reach.`;
    if (fix.event === "plank") return `Hold the plank ${formatTime(gap)} longer (${formatTime(fix.targetValue)}) and a full pass is back in reach.`;
    return `Add ${gap} ${gap === 1 ? meta.one : meta.short.toLowerCase()} (${fix.targetValue}) and a full pass is back in reach.`;
  })();

  return (
    <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-[16px] border border-conditional/55 bg-[#17140c] px-4 pt-[18px] pb-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-full w-40"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, rgb(247 185 64 / 0.07) 0 3px, transparent 3px 14px)" }}
      />
      <div className="relative flex flex-col gap-1.5">
        <span className={`${label} text-conditional`}>Out of reach with these locks</span>
        <h2 className={`${headline} text-[30px]`}>Not this plan. Yet.</h2>
        <p className={body}>
          Even with {list(autoIds).toLowerCase()} maxed at 100, your best is <strong className="text-ink">{plan.average.toFixed(2)}%</strong>
          {plan.outcome === "conditional" ? ", still a conditional pass." : "."}
        </p>
      </div>
      {fix && (
        <>
          <div className="relative grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5 rounded-sm border border-[#3a3220] bg-black/30 px-3 py-2.5">
              <span className="font-display text-xs font-bold tracking-[0.14em] text-ink-2 uppercase">Short by</span>
              <span className="font-display text-[28px] leading-none font-extrabold">
                {fix.shortBy} <span className="text-[15px] text-ink-2">PTS</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-sm border border-[#3a3220] bg-black/30 px-3 py-2.5">
              <span className="font-display text-xs font-bold tracking-[0.14em] text-ink-2 uppercase">Costing the most</span>
              <span className="font-display text-[28px] leading-none font-extrabold">
                {EVENTS[fix.event].short} <span className="text-[15px] text-conditional">{fix.costPoints} PTS</span>
              </span>
            </div>
          </div>
          <p className={`relative ${body}`}>{fixCopy}</p>
          <div className="relative flex flex-wrap gap-2">
            {fix.targetValue !== null && (
              <button type="button" onClick={() => onSet(fix.event, fix.targetValue as number)} className={solidBtn}>
                Set {EVENTS[fix.event].short.toLowerCase()} to {formatValue(fix.event, fix.targetValue)}
              </button>
            )}
            <button type="button" onClick={() => onUnlock(fix.event)} className={ghostBtn}>
              Unlock {EVENTS[fix.event].short.toLowerCase()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
