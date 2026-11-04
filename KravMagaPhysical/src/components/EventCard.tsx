import { ArrowDown, Check, Lock, Minus, Pencil, Plus, Table2, X, Zap } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatValue, parseValue, spokenValue } from "../lib/format";
import { EVENTS, type EventId } from "../lib/model";
import { MAX_POINTS, nudge, sliderRange, valueFor, type EventPlan, type PlanStatus } from "../lib/scoring";
import { AnimatedNumber } from "./AnimatedNumber";

const HATCH = "repeating-linear-gradient(135deg, #43d9f5 0 6px, #2bb3cc 6px 12px)";

interface Props {
  plan: EventPlan;
  status: PlanStatus;
  required: number;
  /** Points this Auto event moved in the latest rebalance (negative = easier). */
  moved?: number;
  /** Changes on every rebalance so the wash replays. */
  washKey: number;
  onSet: (value: number) => void;
  onToggleLock: () => void;
  onShowChart: () => void;
}

function noteFor(e: EventPlan, status: PlanStatus): string {
  const { event, locked, value, points, table } = e;
  if (!locked && status === "impossible") return "Maxed at 100, the most this event can give.";
  if (!locked && status === "covered") return `You pass even at the chart minimum (${points} pts here). Anything more is a bonus.`;
  if (!locked && event !== "mile" && value === 0) {
    return `${EVENTS[event].kind === "time" ? "A 0:00 hold" : "0 reps"} still scores ${points} on your chart.`;
  }
  if (locked && points === MAX_POINTS && value !== valueFor(table, MAX_POINTS)) return "Capped at 100. Going further doesn’t add points.";
  if (locked && points === 0) return "Below the chart, so this scores 0.";
  return "";
}

export function EventCard({ plan, status, required, moved = 0, washKey, onSet, onToggleLock, onShowChart }: Props) {
  const { event, table, locked, value, points } = plan;
  const meta = EVENTS[event];
  const auto = !locked;
  const titleId = useId();

  const lower = table.better === "lower";
  const range = sliderRange(table);
  const sliderMin = lower ? -range.max : range.min;
  const sliderMax = lower ? -range.min : range.max;
  const toSlider = (v: number) => Math.max(sliderMin, Math.min(sliderMax, lower ? -v : v));
  const pct = (v: number) => ((toSlider(v) - sliderMin) / (sliderMax - sliderMin)) * 100;
  const fillPct = pct(value);
  const reqPct = pct(valueFor(table, required));

  const tag = locked ? "Locked" : status === "impossible" ? "Maxed" : "Auto";
  const eyebrow = locked ? "Your number" : status === "impossible" ? "Best case" : status === "covered" ? "Chart minimum" : "You need";
  const note = noteFor(plan, status);
  const stepWords: [string, string] =
    event === "mile"
      ? ["Mile slower by one point", "Mile faster by one point"]
      : event === "plank"
        ? ["Plank shorter by one point", "Plank longer by one point"]
        : [`One ${meta.one} fewer`, `One ${meta.one} more`];

  return (
    <article
      aria-labelledby={titleId}
      className={`relative flex flex-col gap-2.5 overflow-hidden rounded-md px-4 pt-4 pb-3.5 ${
        auto ? "auto-live border-[1.5px] border-dashed border-auto/80 bg-auto-bg" : "border-[1.5px] border-locked-line bg-locked-bg"
      }`}
    >
      {auto && moved !== 0 && <span key={washKey} className="wash" aria-hidden="true" />}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-[110px] w-[140px]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 2px, transparent 2px 11px)",
          maskImage: "linear-gradient(215deg, #000 0%, transparent 72%)",
          WebkitMaskImage: "linear-gradient(215deg, #000 0%, transparent 72%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span aria-hidden="true" className="font-display text-2xl leading-none font-extrabold text-stripe-text italic">
            {meta.n}
          </span>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <h3 id={titleId} className="m-0 font-display text-[21px] leading-none font-bold tracking-[0.05em] uppercase">
              {meta.name}
            </h3>
            <span className="hidden text-xs leading-4 text-ink-3 min-[960px]:block">{meta.sub}</span>
            <button
              type="button"
              onClick={onShowChart}
              className="btn -mx-1 inline-flex min-h-6 items-center gap-1 self-start rounded-xs px-1 text-xs text-ink-2 hover:text-ink"
            >
              <Table2 className="size-3.5" aria-hidden="true" />
              <span className="underline decoration-white/25 underline-offset-2">{table.chartLabel}</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleLock}
          aria-pressed={locked}
          aria-label={locked ? `${meta.short} is locked. Unlock to let the app set it` : `${meta.short} is auto. Lock it at ${formatValue(event, value)}`}
          title={locked ? "Tap to unlock and let the app set it" : "Tap to lock this number"}
          className={`btn inline-flex h-11 min-w-11 flex-none items-center gap-[7px] rounded-full border-[1.5px] pr-3.5 pl-3 font-display text-[15px] font-extrabold tracking-[0.14em] uppercase ${
            locked ? "border-locked bg-locked text-bg" : "border-auto bg-auto/12 text-auto-text"
          }`}
        >
          {locked ? <Lock className="size-4" strokeWidth={2.6} aria-hidden="true" /> : <Zap className="size-4 fill-current" aria-hidden="true" />}
          {tag}
        </button>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`font-display text-[13px] font-bold tracking-[0.16em] uppercase ${auto ? "text-auto" : "text-ink-2"}`}>{eyebrow}</span>
          <EditableValue event={event} value={value} auto={auto} onCommit={onSet} />
        </div>
        <div className="flex flex-none flex-col items-end gap-1.5">
          {auto && moved !== 0 && (
            <span
              key={washKey}
              className={`pop inline-flex h-6 items-center gap-1 rounded-full pr-[9px] pl-[7px] font-display text-[13px] font-bold tracking-[0.08em] whitespace-nowrap uppercase ${
                moved < 0 ? "bg-auto/16 text-auto-text" : "bg-conditional/16 text-conditional"
              }`}
            >
              <ArrowDown className={`size-3 ${moved > 0 ? "rotate-180" : ""}`} strokeWidth={3} aria-hidden="true" />
              {Math.abs(moved)} {Math.abs(moved) === 1 ? "pt" : "pts"} {moved < 0 ? "easier" : "harder"}
            </span>
          )}
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={points}
              format={(v) => String(Math.round(v))}
              className={`font-display text-[46px] leading-[0.95] font-extrabold tabular ${auto ? "text-auto-text" : "text-ink"}`}
            />
            <span className="font-display text-[15px] font-bold tracking-[0.12em] text-ink-3">PTS</span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2.5">
        <Stepper dir={-1} label={stepWords[0]} onStep={() => onSet(nudge(table, value, -1))} />
        <div className="relative h-11 min-w-0 flex-auto">
          <input
            type="range"
            className="range"
            min={sliderMin}
            max={sliderMax}
            step={1}
            value={toSlider(value)}
            aria-label={meta.name}
            aria-valuetext={`${meta.short}, ${spokenValue(event, value)}, ${points} points, ${locked ? "locked" : "auto"}`}
            onChange={(e) => {
              const v = Number(e.target.value);
              onSet(lower ? -v : v);
            }}
          />
          <div className="rail pointer-events-none absolute inset-y-0 right-3.5 left-3.5" aria-hidden="true">
            <div className="absolute top-[18px] -right-3.5 -left-3.5 h-2 rounded-full bg-[#262a31]" />
            <div
              className={`absolute top-[18px] -left-3.5 h-2 rounded-full ${auto ? "spring-move" : ""}`}
              style={{ width: `calc(${fillPct}% + 14px)`, background: auto ? HATCH : "var(--color-locked)" }}
            />
            <div className="absolute top-[11px] -ml-[1.5px] h-[22px] w-[3px] rounded-[2px] bg-stripe-hot" style={{ left: `${reqPct}%` }} />
            <div
              className={`thumb ${auto ? "spring-move" : ""}`}
              style={{
                left: `${fillPct}%`,
                background: "#f4f1ec",
                border: `4px solid ${auto ? "#43d9f5" : "#0a0b0d"}`,
                boxShadow: `0 2px 10px rgb(0 0 0 / 0.55), 0 0 0 6px ${auto ? "rgb(67 217 245 / 0.18)" : "rgb(233 229 222 / 0.25)"}`,
              }}
            />
          </div>
        </div>
        <Stepper dir={1} label={stepWords[1]} onStep={() => onSet(nudge(table, value, 1))} />
      </div>
      <div
        aria-hidden="true"
        className="relative mx-[54px] -mt-1.5 flex justify-between font-display text-xs font-semibold tracking-[0.14em] text-ink-3 uppercase"
      >
        <span>&lsaquo; {meta.ends[0]}</span>
        <span>{meta.ends[1]} &rsaquo;</span>
      </div>
      {note && <p className="relative m-0 text-xs leading-[17px] text-ink-2">{note}</p>}
    </article>
  );
}

/** +/- button; hold to repeat. Each press is one point (see `nudge`). */
function Stepper({ dir, label, onStep }: { dir: 1 | -1; label: string; onStep: () => void }) {
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const start = () => {
    stop();
    stepRef.current();
    const repeat = (delay: number) => {
      timer.current = window.setTimeout(() => {
        stepRef.current();
        repeat(Math.max(45, delay * 0.85));
      }, delay);
    };
    repeat(420);
  };

  const Icon = dir === 1 ? Plus : Minus;
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onClick={(e) => {
        // Keyboard activation (Enter/Space) arrives as a click with detail 0.
        if (e.detail === 0) onStep();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="btn flex size-11 flex-none touch-none items-center justify-center rounded-sm border border-line-strong bg-control select-none"
    >
      <Icon className="size-5" strokeWidth={2.6} aria-hidden="true" />
    </button>
  );
}

/** Big value with a pencil; tap to type. Save (or Enter) always locks, even if the number matches the Auto value. */
function EditableValue({ event, value, auto, onCommit }: { event: EventId; value: number; auto: boolean; onCommit: (v: number) => void }) {
  const meta = EVENTS[event];
  const isTime = meta.kind === "time";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const hintId = useId();
  const text = formatValue(event, value);

  const cancel = () => {
    setEditing(false);
    setError("");
  };
  const commit = () => {
    const parsed = parseValue(event, draft);
    if (parsed === null) {
      setError(isTime ? "Use m:ss, like 8:40 or 8.40" : "Whole reps, like 52");
      return;
    }
    setEditing(false);
    setError("");
    onCommit(parsed);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={inputId}>
            {meta.name}, {isTime ? "minutes and seconds" : "reps"}
          </label>
          <input
            id={inputId}
            autoFocus
            type="text"
            value={draft}
            inputMode={isTime ? "decimal" : "numeric"}
            enterKeyHint="done"
            autoComplete="off"
            placeholder={isTime ? "m:ss" : "reps"}
            aria-invalid={error ? true : undefined}
            aria-describedby={hintId}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className={`h-14 w-[124px] rounded-sm border-2 bg-bg px-3 font-display text-[40px] font-extrabold tabular outline-none ${error ? "border-retest" : "border-ink"}`}
          />
          <button type="button" onClick={commit} aria-label="Save" className="btn flex size-11 items-center justify-center rounded-sm bg-stripe text-white">
            <Check className="size-5" strokeWidth={3} aria-hidden="true" />
          </button>
          <button type="button" onClick={cancel} aria-label="Cancel" className="btn flex size-11 items-center justify-center rounded-sm border border-line-strong bg-control">
            <X className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
        <span id={hintId} role={error ? "alert" : undefined} className={`text-xs leading-4 ${error ? "text-[#ff8a8a]" : "text-ink-3"}`}>
          {error || (isTime ? "Type m:ss, like 8:40 or 8.40. Enter saves and locks it." : "Type whole reps. Enter saves and locks it.")}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(text);
        setEditing(true);
      }}
      aria-label={`Type your ${meta.short.toLowerCase()}${isTime ? " time" : " reps"}. Currently ${spokenValue(event, value)}`}
      className={`btn flex min-h-14 cursor-text items-baseline gap-1.5 rounded-[6px] pr-1.5 text-left ${auto ? "text-auto-text" : "text-ink"}`}
    >
      <AnimatedNumber
        value={value}
        format={(v) => formatValue(event, v)}
        className="font-display text-[58px] leading-[0.95] font-extrabold tracking-[-0.01em] tabular"
      />
      {!isTime && <span className="font-display text-lg font-semibold tracking-[0.06em] text-ink-3 uppercase">reps</span>}
      <Pencil className="size-[15px] self-center text-ink-3" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
