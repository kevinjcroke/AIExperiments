import { formatAverage } from "../lib/format";
import { GRACE_POINTS, OUTCOME_COPY, type Outcome } from "../lib/model";
import { AnimatedNumber } from "./AnimatedNumber";
import { OUTCOME_COLOR, OutcomeBadge } from "./OutcomeBadge";

const GLOW: Record<Outcome, string> = {
  pass: "rgb(54 209 126 / 0.45)",
  conditional: "rgb(247 185 64 / 0.45)",
  retest: "rgb(255 107 107 / 0.45)",
};

// 270-degree arcs drawn as dashed circles rotated to start at the bottom-left.
const MAIN_R = 128;
const MAIN_C = 2 * Math.PI * MAIN_R;
const MAIN_L = MAIN_C * 0.75;
const RING_R = 150;
const RING_C = 2 * Math.PI * RING_R;
const RING_L = RING_C * 0.75;
const deg = (pct: number) => 135 + 2.7 * pct;

/** Broadcast-style dial: score arc, pass / conditional zones on an outer ring, required marker, riding knob. */
export function ScoreGauge({
  average,
  required,
  total,
  need,
  outcome,
  caption,
}: {
  average: number;
  required: number;
  total: number;
  need: number;
  outcome: Outcome;
  caption: string;
}) {
  const a = Math.max(0, Math.min(100, average));
  const color = OUTCOME_COLOR[outcome];
  const cond = required - GRACE_POINTS;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="img"
        aria-label={`${caption} ${formatAverage(average)} percent. ${total} of ${need} points needed. ${required} percent required. ${OUTCOME_COPY[outcome].label}.`}
        className="relative aspect-square w-full max-w-[340px] [container-type:inline-size]"
      >
        <svg aria-hidden="true" viewBox="0 0 320 320" className="block size-full overflow-visible">
          <defs>
            <pattern id="cond-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#4a3510" />
              <rect width="3" height="6" fill="#f7b940" />
            </pattern>
          </defs>
          <circle cx="160" cy="160" r="112" fill="#0e1013" />

          {/* outer ring: pass zone and the 5-point conditional zone */}
          <circle cx="160" cy="160" r={RING_R} fill="none" stroke="#1f2328" strokeWidth="6" strokeDasharray={`${RING_L} ${RING_C}`} transform="rotate(135 160 160)" />
          <circle
            cx="160"
            cy="160"
            r={RING_R}
            fill="none"
            stroke="#36d17e"
            strokeOpacity="0.55"
            strokeWidth="6"
            strokeDasharray={`${(RING_L * (100 - required)) / 100} ${RING_C}`}
            strokeDashoffset={(-RING_L * required) / 100}
            transform="rotate(135 160 160)"
          />
          <circle
            cx="160"
            cy="160"
            r={RING_R}
            fill="none"
            stroke="url(#cond-hatch)"
            strokeWidth="6"
            strokeDasharray={`${(RING_L * GRACE_POINTS) / 100} ${RING_C}`}
            strokeDashoffset={(-RING_L * cond) / 100}
            transform="rotate(135 160 160)"
          />

          {/* main arc */}
          <circle cx="160" cy="160" r={MAIN_R} fill="none" stroke="#1f2328" strokeWidth="20" strokeDasharray={`${MAIN_L} ${MAIN_C}`} transform="rotate(135 160 160)" />
          <circle
            className="gauge-arc"
            cx="160"
            cy="160"
            r={MAIN_R}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={`${(MAIN_L * a) / 100} ${MAIN_C}`}
            transform="rotate(135 160 160)"
            style={{ filter: `drop-shadow(0 0 10px ${GLOW[outcome]})` }}
          />

          <g stroke="#3a404a" strokeWidth="2">
            {Array.from({ length: 11 }, (_, i) => (
              <line key={i} x1={i % 5 === 0 ? 266 : 268} y1="160" x2="274" y2="160" transform={`rotate(${deg(i * 10)} 160 160)`} />
            ))}
          </g>

          {/* required marker crosses both rings */}
          <g transform={`rotate(${deg(required)} 160 160)`}>
            <rect x="262" y="155" width="58" height="10" rx="2" fill="#ff3b44" />
            <rect x="262" y="159" width="58" height="2" fill="#fff" fillOpacity="0.85" />
          </g>

          <g className="gauge-knob" style={{ transform: `rotate(${deg(a)}deg)` }}>
            <circle cx="288" cy="160" r="14" fill="#0a0b0d" stroke={color} strokeWidth="4" />
            <circle cx="288" cy="160" r="5" fill="#f4f1ec" />
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 pb-[6%]">
          <span className="font-display text-sm font-bold tracking-[0.2em] text-ink-2 uppercase">{caption}</span>
          <span className="flex items-start font-display text-[25cqi] leading-[0.9] font-extrabold tracking-[-0.01em] tabular">
            <AnimatedNumber value={average} format={(v) => (Math.round(v * 4) / 4).toFixed(2)} />
            <span className="ml-0.5 text-[0.42em] leading-[1.2]" style={{ color }}>
              %
            </span>
          </span>
          <span className="font-display text-[19px] font-semibold tracking-[0.04em] text-ink-2 uppercase tabular">
            <span className="text-ink">{total}</span> / {need} pts needed
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-[3%] flex justify-center">
          <OutcomeBadge outcome={outcome} size="m" />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-3.5 rounded-[2px] bg-stripe-hot" />
          {required}% required
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-1.5 w-3.5 rounded-[2px]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #f7b940 0 2px, #4a3510 2px 4px)" }}
          />
          {cond}&ndash;{required} conditional pass
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-3.5 rounded-[2px] bg-pass/70" />
          Pass zone
        </span>
      </div>
    </div>
  );
}
