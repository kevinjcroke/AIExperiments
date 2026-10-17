import { useEffect, useState } from "react";
import { debugState } from "../lib/debug";
import { useActiveCountries, useWheelStore } from "../store/wheelStore";

/** `?debug=1` readout: polls the non-reactive debugState so the wheel never re-renders for it. */
export default function DebugOverlay() {
  const [, force] = useState(0);
  const selectedId = useWheelStore((s) => s.selectedId);
  const phase = useWheelStore((s) => s.phase);
  const active = useActiveCountries();

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      force((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const d = debugState;
  const rows: [string, string][] = [
    ["phase", phase],
    ["rotation", d.rotation.toFixed(4)],
    ["n", String(d.n)],
    ["indexAtPointer", `${d.indexAtPointer} (${active[d.indexAtPointer]?.id ?? "—"})`],
    ["winner", `${d.winnerIndex} (${d.winnerId ?? "—"})`],
    ["selectedId", selectedId ?? "null"],
    ["spins", String(d.spins)],
    ["mismatches", String(d.mismatches)],
  ];

  return (
    <div
      data-testid="debug-overlay"
      className="pointer-events-none fixed top-2 left-2 z-[100] rounded-md bg-black/80 px-3 py-2 font-mono text-[11px] leading-4 text-lime-300"
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="text-slate-300">{k}:</span> {v}
        </div>
      ))}
    </div>
  );
}
