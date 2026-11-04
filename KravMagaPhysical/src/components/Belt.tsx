import type { CSSProperties } from "react";
import { rankById, type RankId } from "../lib/model";

/**
 * A belt in the rank's colours (two-tone ranks split lengthwise) with the red stripe tape.
 * `variant="band"` is the full-width weave across the top of the page.
 */
export function Belt({
  rank,
  className = "",
  stripe = true,
  variant = "chip",
  style,
}: {
  rank: RankId;
  className?: string;
  stripe?: boolean;
  variant?: "chip" | "band";
  style?: CSSProperties;
}) {
  const [a, b] = rankById(rank).belt;
  const band = variant === "band";
  return (
    <span
      aria-hidden="true"
      className={`relative block ${band ? "" : "rounded-[3px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.35)]"} ${className}`}
      style={{ background: `linear-gradient(180deg, ${a} 0 50%, ${b} 50% 100%)`, ...style }}
    >
      {band && (
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgb(0 0 0 / 0.22) 0 1px, transparent 1px 5px), linear-gradient(180deg, rgb(255 255 255 / 0.14), rgb(0 0 0 / 0.28))",
          }}
        />
      )}
      {stripe && (
        <span
          className="absolute top-0 bottom-0 bg-stripe"
          style={
            band
              ? { right: "14%", width: 44, boxShadow: "-3px 0 0 var(--color-bg), 3px 0 0 var(--color-bg)" }
              : { right: "18%", width: "18%", maxWidth: 12, boxShadow: "0 0 0 1px var(--color-bg)" }
          }
        />
      )}
    </span>
  );
}
