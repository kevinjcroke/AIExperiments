import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { OUTCOME_COPY, type Outcome } from "../lib/model";

export const OUTCOME_COLOR: Record<Outcome, string> = {
  pass: "var(--color-pass)",
  conditional: "var(--color-conditional)",
  retest: "var(--color-retest)",
};

const FG: Record<Outcome, string> = { pass: "#04170b", conditional: "#1c1300", retest: "#220405" };
const ICON = { pass: Check, conditional: AlertTriangle, retest: RotateCcw } as const;

/** Slanted outcome badge. Colour always comes with an icon and the words. */
export function OutcomeBadge({ outcome, size = "l", className = "" }: { outcome: Outcome; size?: "m" | "l"; className?: string }) {
  const Icon = ICON[outcome];
  const large = size === "l";
  return (
    <span
      className={`slant-lg inline-flex items-center gap-2 pr-5 pl-4 font-display leading-none font-extrabold tracking-[0.06em] whitespace-nowrap uppercase ${
        large ? "h-[46px] text-[22px]" : "h-9 text-[17px]"
      } ${outcome === "pass" ? "shine" : ""} ${className}`}
      style={{ backgroundColor: OUTCOME_COLOR[outcome], color: FG[outcome] }}
    >
      <Icon className={large ? "size-5" : "size-[18px]"} strokeWidth={3} aria-hidden="true" />
      {OUTCOME_COPY[outcome].label}
    </span>
  );
}
