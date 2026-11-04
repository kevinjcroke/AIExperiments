import type { ReactNode } from "react";

export type Tone = "math" | "reading" | "neutral" | "accent" | "good" | "bad";

const CHIP: Record<Tone, string> = {
  math: "bg-math-soft text-math",
  reading: "bg-reading-soft text-reading",
  neutral: "bg-paper-2 text-ink-2",
  accent: "bg-accent-soft text-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-ink))]",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
};

export function Chip({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold tracking-wide ${CHIP[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Small dots showing progress toward mastery (filled = earned). */
export function MasteryDots({ earned, total, label }: { earned: number; total: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-ink-3" title={label}>
      <span className="sr-only">{label}</span>
      <span className="inline-flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < earned ? "bg-accent" : "border border-line-2 bg-transparent"}`} />
        ))}
      </span>
      <span aria-hidden>{label}</span>
    </span>
  );
}

export interface Segment {
  value: number;
  className: string;
  label: string;
}

/** Horizontal stacked bar (mastered / learning / missed / new). */
export function StackBar({ segments, total, className = "h-2" }: { segments: Segment[]; total: number; className?: string }) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-paper-2 ${className}`}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
    >
      {segments.map((s) =>
        s.value > 0 ? <div key={s.label} className={`${s.className} anim-grow`} style={{ width: `${(100 * s.value) / Math.max(1, total)}%` }} /> : null,
      )}
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 7, className = "text-accent", children }: { value: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-paper-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={className}
          style={{ transition: "stroke-dashoffset 700ms var(--ease-out-soft)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-[1.4rem] place-items-center rounded-md border border-line-2 bg-card px-1 font-sans text-[0.68rem] font-semibold text-ink-2 shadow-[0_1px_0_var(--color-line-2)]">
      {children}
    </kbd>
  );
}

export function Toggle<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-paper-2 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              on ? "bg-card text-ink shadow-[var(--shadow-card)] ring-1 ring-line-2" : "text-ink-3 hover:text-ink"
            }`}
          >
            {o.label}
            {o.sub !== undefined && <span className={`ml-1 font-medium ${on ? "text-ink-3" : "text-ink-3/80"}`}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

const FILTER_ON: Record<"math" | "reading" | "neutral", string> = {
  math: "border-math bg-math text-white dark:text-[var(--color-paper)]",
  reading: "border-reading bg-reading text-white dark:text-[var(--color-paper)]",
  neutral: "border-ink bg-ink text-paper",
};

export function FilterChip({
  on,
  onClick,
  children,
  count,
  tone,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
  tone: "math" | "reading" | "neutral";
}) {
  const onCls = FILTER_ON[tone];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all active:scale-[0.97] ${
        on ? onCls : "border-line bg-card text-ink-2 hover:border-line-2 hover:text-ink"
      }`}
    >
      {children}
      {count !== undefined && <span className={`tabular text-xs font-medium ${on ? "opacity-80" : "text-ink-3"}`}>{count}</span>}
    </button>
  );
}
