import { motion } from "motion/react";
import { RotateCcw, SearchX } from "lucide-react";
import { useActiveCountries, useWheelStore } from "../../store/wheelStore";
import { FOCUS_RING } from "./styles";

/** Overlay on the wheel stage when nothing is spinnable. */
export function StageEmptyState() {
  const active = useActiveCountries().length;
  const allEliminated = useWheelStore(
    (s) => s.dataset.countries.length > 0 && s.eliminatedIds.length >= s.dataset.countries.length,
  );
  const resetEliminated = useWheelStore((s) => s.resetEliminated);
  const setFilters = useWheelStore((s) => s.setFilters);

  if (active > 0) return null;

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/55 p-6 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-slate-900/90 p-6 text-center shadow-2xl ring-1 ring-white/15 backdrop-blur-md"
      >
        {allEliminated ? (
          <>
            <p className="text-4xl" aria-hidden>
              🎉
            </p>
            <h2 className="mt-3 text-xl font-black text-slate-50">You've eaten your way around the world</h2>
            <p className="mt-2 text-sm text-slate-200">Every country is marked visited. Ready for another lap?</p>
            <button
              type="button"
              onClick={resetEliminated}
              className={`mx-auto mt-5 flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 font-bold text-slate-950 shadow-[0_4px_0_0_#b45309] hover:bg-amber-200 active:translate-y-[3px] active:shadow-[0_1px_0_0_#b45309] ${FOCUS_RING}`}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset the wheel
            </button>
          </>
        ) : (
          <>
            <SearchX className="mx-auto size-10 text-amber-300" aria-hidden />
            <h2 className="mt-3 text-xl font-black text-slate-50">No matches — loosen your filters</h2>
            <p className="mt-2 text-sm text-slate-200">No country on the wheel has a restaurant matching every filter you picked.</p>
            <button
              type="button"
              onClick={() => setFilters({ diningStyles: [], priceRanges: [] })}
              className={`mx-auto mt-5 rounded-full bg-amber-300 px-5 py-2.5 font-bold text-slate-950 shadow-[0_4px_0_0_#b45309] hover:bg-amber-200 active:translate-y-[3px] active:shadow-[0_1px_0_0_#b45309] ${FOCUS_RING}`}
            >
              Clear filters
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
