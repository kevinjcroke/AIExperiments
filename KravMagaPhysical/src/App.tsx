import confetti from "canvas-confetti";
import { useReducedMotion } from "motion/react";
import { Lock, Unlock, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventCard } from "./components/EventCard";
import { Header } from "./components/Header";
import { HowItWorks, MiniScore, Onboarding, SettingsPanel } from "./components/Panels";
import { PointsSplit } from "./components/PointsSplit";
import { ReferenceTable } from "./components/ReferenceTable";
import { ScoreGauge } from "./components/ScoreGauge";
import { Sheet } from "./components/Sheet";
import { StateBanner } from "./components/StateBanner";
import { EVENT_IDS, type EventId, type Profile } from "./lib/model";
import { solve, type Plan, type PlanStatus } from "./lib/scoring";
import { useRebalanceFeedback } from "./lib/useRebalanceFeedback";
import { usePlanner } from "./store/plannerStore";

export default function App() {
  const profile = usePlanner((s) => s.profile);
  return profile ? <Planner profile={profile} /> : <Onboarding />;
}

const BUG: Record<PlanStatus, { text: string; dot: string }> = {
  balanced: { text: "Live plan", dot: "#43d9f5" },
  calculator: { text: "Your score", dot: "#e9e5de" },
  impossible: { text: "Best case", dot: "#f7b940" },
  covered: { text: "Covered", dot: "#36d17e" },
};

/** Confetti when a fully locked result turns into a pass. */
function useCelebrate(plan: Plan) {
  const reduce = useReducedMotion();
  const prev = useRef<{ status: PlanStatus; outcome: Plan["outcome"] } | null>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = { status: plan.status, outcome: plan.outcome };
    if (!was || reduce) return;
    const win = (s: { status: PlanStatus; outcome: Plan["outcome"] }) => s.status === "calculator" && s.outcome === "pass";
    if (win(plan) && !win(was)) {
      const colors = ["#db222b", "#f4f1ec", "#2f6bd8", "#7b4f2c", "#36d17e", "#43d9f5"];
      void confetti({ particleCount: 90, spread: 70, startVelocity: 45, origin: { x: 0.25, y: 0.35 }, colors, disableForReducedMotion: true });
      void confetti({ particleCount: 90, spread: 70, startVelocity: 45, origin: { x: 0.75, y: 0.35 }, colors, disableForReducedMotion: true });
    }
  }, [plan, reduce]);
}

const corner = "absolute size-4 border-[#4a515c]";
const outlineBtn = "btn h-11 rounded-sm border border-line-strong bg-transparent px-3.5 text-sm font-semibold";

function Planner({ profile }: { profile: Profile }) {
  const locked = usePlanner((s) => s.locked);
  const setValue = usePlanner((s) => s.setValue);
  const unlock = usePlanner((s) => s.unlock);
  const unlockAll = usePlanner((s) => s.unlockAll);
  const plan = useMemo(() => solve(profile, locked), [profile, locked]);
  const feedback = useRebalanceFeedback(plan);
  const [sheet, setSheet] = useState<null | "settings" | "reference">(null);
  const [chartFocus, setChartFocus] = useState<EventId | null>(null);
  const anyLocked = EVENT_IDS.some((id) => plan.events[id].locked);
  const bug = BUG[plan.status];

  useCelebrate(plan);

  // Phones: show a compact score bar once the gauge scrolls out of view.
  const gaugeRef = useRef<HTMLElement>(null);
  const [gaugeVisible, setGaugeVisible] = useState(true);
  useEffect(() => {
    const el = gaugeRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setGaugeVisible(entry?.isIntersecting ?? true), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openReference = (focus: EventId | null) => {
    setChartFocus(focus);
    setSheet("reference");
  };

  return (
    <div className="min-h-dvh pb-8">
      <p className="sr-only" aria-live="polite">
        {feedback.announce}
      </p>
      {!gaugeVisible && <MiniScore plan={plan} />}

      <div className="mx-auto max-w-[1440px]">
        <Header profile={profile} onOpenChart={() => openReference(null)} onOpenSettings={() => setSheet("settings")} />

        {/*
          Phones: score, status, the four events you edit, then the points chart.
          960px and up: score, status and points chart stacked on the left, events on the right.
          The DOM follows the phone order so screen readers and keyboard focus match it too.
        */}
        <main className="grid grid-cols-1 gap-5 px-5 pt-5 min-[960px]:grid-cols-[420px_minmax(0,1fr)] min-[960px]:grid-rows-[auto_auto_auto_1fr] min-[960px]:items-start min-[960px]:gap-x-8 min-[960px]:gap-y-4">
          <section
            ref={gaugeRef}
            aria-label="Overall score"
            className="relative min-w-0 rounded-lg border border-line px-3.5 pt-10 pb-4 min-[960px]:col-start-1 min-[960px]:row-start-1"
            style={{ background: "radial-gradient(90% 70% at 50% 0%, rgb(255 255 255 / 0.07), transparent 70%), var(--color-hero)" }}
          >
            <span aria-hidden="true" className={`${corner} top-2.5 left-2.5 border-t-2 border-l-2`} />
            <span aria-hidden="true" className={`${corner} top-2.5 right-2.5 border-t-2 border-r-2`} />
            <span aria-hidden="true" className={`${corner} bottom-2.5 left-2.5 border-b-2 border-l-2`} />
            <span aria-hidden="true" className={`${corner} right-2.5 bottom-2.5 border-r-2 border-b-2`} />
            <span className="absolute top-3.5 left-1/2 inline-flex h-[22px] -translate-x-1/2 items-center gap-[7px] rounded-xs border border-line-strong bg-surface-2 px-2.5 font-display text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase">
              <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: bug.dot }} />
              {bug.text}
            </span>
            <ScoreGauge
              average={plan.average}
              required={plan.required}
              total={plan.totalPoints}
              need={plan.requiredTotal}
              outcome={plan.outcome}
              caption={plan.status === "impossible" ? "Best possible" : "Average"}
            />
          </section>

          <div className="min-w-0 min-[960px]:col-start-1 min-[960px]:row-start-2">
            <StateBanner plan={plan} onSet={setValue} onUnlock={unlock} onUnlockAll={unlockAll} />
          </div>

          <section
            aria-labelledby="events-title"
            className="flex min-w-0 flex-col gap-3 min-[960px]:col-start-2 min-[960px]:row-span-4 min-[960px]:row-start-1"
          >
            <div className="flex min-h-11 items-center justify-between gap-3">
              <h2 id="events-title" className="m-0 font-display text-2xl font-extrabold tracking-[0.08em] uppercase">
                The four events
              </h2>
              {anyLocked && (
                <button
                  type="button"
                  onClick={unlockAll}
                  className="btn inline-flex h-11 items-center gap-1.5 rounded-sm border border-line-strong bg-transparent px-3 font-display text-[15px] font-bold tracking-[0.1em] uppercase"
                >
                  <Unlock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                  Unlock all
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[13px] leading-[18px] text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] border-auto px-2 font-display text-xs font-extrabold tracking-[0.14em] text-auto-text">
                  <Zap className="size-[11px] fill-current" aria-hidden="true" />
                  AUTO
                </span>
                shows what you need
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-locked px-2 font-display text-xs font-extrabold tracking-[0.14em] text-bg">
                  <Lock className="size-[11px]" strokeWidth={3} aria-hidden="true" />
                  LOCKED
                </span>
                holds your number
              </span>
              <span>Change a number to lock it. Tap the tag to switch.</span>
            </div>
            {/* Two card columns only when each card gets ~390px; below that the value and points collide. */}
            <div className="grid grid-cols-1 gap-3 min-[960px]:gap-4 min-[1280px]:grid-cols-2">
              {EVENT_IDS.map((id) => (
                <EventCard
                  key={id}
                  plan={plan.events[id]}
                  status={plan.status}
                  required={plan.required}
                  moved={feedback.moved[id]}
                  washKey={feedback.tick}
                  onSet={(v) => setValue(id, v)}
                  onToggleLock={() => (plan.events[id].locked ? unlock(id) : setValue(id, plan.events[id].value))}
                  onShowChart={() => openReference(id)}
                />
              ))}
            </div>
          </section>

          <div className="min-w-0 min-[960px]:col-start-1 min-[960px]:row-start-3">
            <PointsSplit plan={plan} moved={feedback.moved} />
          </div>
        </main>

        <HowItWorks />

        <footer className="mx-5 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-surface-3 pt-4">
          <p className="m-0 text-xs leading-[17px] text-ink-3">Saved on this device. No account, no sign-in.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => openReference(null)} className={outlineBtn}>
              Scoring chart
            </button>
            <button type="button" onClick={() => setSheet("settings")} className={outlineBtn}>
              Settings
            </button>
          </div>
        </footer>
      </div>

      <Sheet open={sheet === "reference"} onClose={() => setSheet(null)} title="Your scoring chart">
        <ReferenceTable plan={plan} profile={profile} highlight={chartFocus} />
      </Sheet>
      <Sheet open={sheet === "settings"} onClose={() => setSheet(null)} title="Settings">
        <SettingsPanel profile={profile} onClose={() => setSheet(null)} />
      </Sheet>
    </div>
  );
}
