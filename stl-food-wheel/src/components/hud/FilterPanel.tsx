import { SlidersHorizontal } from "lucide-react";
import { useActiveCountries, useWheelStore, type Filters } from "../../store/wheelStore";
import { DINING_STYLES, PRICE_RANGES } from "../../types/wheel";
import { FOCUS_RING } from "./styles";

function toggle<T>(list: readonly T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Chip({
  label,
  pressed,
  disabled,
  onClick,
  ariaLabel,
  wide,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  ariaLabel?: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={[
        "min-h-9 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        pressed
          ? "bg-amber-300 text-slate-950 shadow-[0_2px_0_0_#b45309] ring-1 ring-amber-200"
          : "bg-white/5 text-slate-200 ring-1 ring-white/15 hover:bg-white/10 hover:text-slate-50",
        wide ? "min-w-14 font-mono tracking-wider" : "",
        FOCUS_RING,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

const PRICE_WORDS: Record<string, string> = { $: "Inexpensive", $$: "Moderate", $$$: "Pricey", $$$$: "Very expensive" };

export function FilterPanel({ showCount = true }: { showCount?: boolean }) {
  const filters = useWheelStore((s) => s.filters);
  const setFilters = useWheelStore((s) => s.setFilters);
  const spinning = useWheelStore((s) => s.phase === "spinning");
  const total = useWheelStore((s) => s.dataset.countries.length);
  const active = useActiveCountries().length;
  const anyFilter = filters.diningStyles.length > 0 || filters.priceRanges.length > 0;
  const set = (f: Partial<Filters>) => setFilters(f);

  return (
    <section aria-labelledby="filters-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="filters-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
          <SlidersHorizontal className="size-4 text-amber-300" aria-hidden />
          Filters
        </h2>
        {anyFilter && (
          <button
            type="button"
            onClick={() => set({ diningStyles: [], priceRanges: [] })}
            disabled={spinning}
            className={`rounded text-sm font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:decoration-amber-300 disabled:opacity-60 ${FOCUS_RING}`}
          >
            Clear filters
          </button>
        )}
      </div>

      <p className={showCount ? "text-sm text-slate-200" : "sr-only"} aria-live="polite">
        <span className="text-2xl font-black tabular-nums text-slate-50">{active}</span>{" "}
        {active === 1 ? "country" : "countries"} on the wheel
        {active !== total && <span className="text-slate-300"> (of {total})</span>}
      </p>

      <fieldset className="space-y-2" disabled={spinning}>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Dining style</legend>
        <div className="flex flex-wrap gap-2">
          {DINING_STYLES.map((d) => (
            <Chip
              key={d}
              label={d}
              pressed={filters.diningStyles.includes(d)}
              disabled={spinning}
              onClick={() => set({ diningStyles: toggle(filters.diningStyles, d) })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={spinning}>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Price</legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((p) => (
            <Chip
              key={p}
              label={p}
              wide
              ariaLabel={`${p} (${PRICE_WORDS[p]})`}
              pressed={filters.priceRanges.includes(p)}
              disabled={spinning}
              onClick={() => set({ priceRanges: toggle(filters.priceRanges, p) })}
            />
          ))}
        </div>
      </fieldset>
      {spinning && <p className="text-xs text-slate-300">Filters unlock when the wheel stops.</p>}
    </section>
  );
}
