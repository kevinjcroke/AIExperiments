import { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { useWheelStore } from "../../store/wheelStore";
import { FlagIcon } from "../FlagIcon";
import { FOCUS_RING } from "./styles";

export function EliminatedList() {
  const eliminatedIds = useWheelStore((s) => s.eliminatedIds);
  const dataset = useWheelStore((s) => s.dataset);
  const restore = useWheelStore((s) => s.restore);
  const resetEliminated = useWheelStore((s) => s.resetEliminated);
  const [confirming, setConfirming] = useState(false);
  const eliminated = dataset.countries.filter((c) => eliminatedIds.includes(c.id));

  return (
    <section aria-labelledby="visited-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="visited-heading" className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
          Visited <span className="ml-1 text-slate-300 tabular-nums">({eliminated.length})</span>
        </h2>
      </div>

      {eliminated.length === 0 ? (
        <p className="text-sm text-slate-300">
          Countries you mark visited leave the wheel and show up here. Tap one to put it back.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Visited countries">
          {eliminated.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => restore(c.id)}
                aria-label={`Put ${c.countryName} back on the wheel`}
                title="Put back on the wheel"
                className={`group flex min-h-9 items-center gap-2 rounded-full bg-emerald-400/10 py-1.5 pl-2 pr-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-300/30 transition hover:bg-emerald-400/20 ${FOCUS_RING}`}
              >
                <FlagIcon code={c.isoCode} className="text-base" />
                <span>{c.shortName}</span>
                <Undo2 className="size-3.5 text-emerald-200 opacity-70 group-hover:opacity-100" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {eliminated.length > 0 &&
        (confirming ? (
          <div role="group" aria-label="Confirm reset" className="flex flex-wrap items-center gap-2 rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-400/30">
            <p className="w-full text-sm text-rose-100">Put all {eliminated.length} visited countries back on the wheel?</p>
            <button
              type="button"
              autoFocus
              onClick={() => {
                resetEliminated();
                setConfirming(false);
              }}
              className={`rounded-full bg-rose-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-rose-400 ${FOCUS_RING}`}
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold text-slate-200 ring-1 ring-white/15 hover:bg-white/10 ${FOCUS_RING}`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-200 ring-1 ring-white/15 hover:bg-white/10 hover:text-slate-50 ${FOCUS_RING}`}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset wheel
          </button>
        ))}
    </section>
  );
}
