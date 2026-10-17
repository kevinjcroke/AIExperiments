import { useId, useState } from "react";
import { motion } from "motion/react";
import { ChefHat, CircleCheck, ExternalLink, Globe, MapPin, X } from "lucide-react";
import type { CountryNode, Restaurant } from "../types/wheel";
import { matchingRestaurants, useWheelStore } from "../store/wheelStore";
import { FlagIcon } from "./FlagIcon";
import { FOCUS_RING } from "./hud/styles";

export interface RestaurantDrawerProps {
  country: CountryNode;
  /** Close the drawer (HudOverlay calls select(null)). */
  onClose: () => void;
  /** Eliminate the country; HudOverlay closes the drawer and shows the Undo toast. */
  onMarkVisited: (countryId: string) => void;
}

const PRICE_LABEL: Record<Restaurant["priceRange"], string> = {
  $: "Inexpensive",
  $$: "Moderate",
  $$$: "Pricey",
  $$$$: "Very expensive",
};

function mapsUrl(r: Pick<Restaurant, "name" | "address">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.address}`)}`;
}

function formatVerified(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug text-slate-50">{r.name}</h3>
        <span
          className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-0.5 font-mono text-sm font-bold tracking-wider text-emerald-200 ring-1 ring-emerald-300/30"
          title={PRICE_LABEL[r.priceRange]}
        >
          <span aria-hidden>{r.priceRange}</span>
          <span className="sr-only">Price: {PRICE_LABEL[r.priceRange]}</span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-1 text-sky-100 ring-1 ring-sky-300/25">
          <MapPin className="size-3" aria-hidden />
          {r.neighborhood}
        </span>
        <span className="rounded-full bg-violet-400/10 px-2 py-1 text-violet-100 ring-1 ring-violet-300/25">
          {r.diningStyle}
        </span>
      </div>

      <div className="mt-3 flex gap-2.5 rounded-xl bg-amber-300/10 p-3 ring-1 ring-amber-300/30">
        <ChefHat className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
        <p className="text-sm text-amber-50">
          <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-amber-300">Order this</span>
          {r.recommendedDish}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        <a
          href={mapsUrl(r)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-start gap-1.5 rounded text-slate-200 underline decoration-slate-400/50 underline-offset-4 hover:text-slate-50 hover:decoration-slate-200 ${FOCUS_RING}`}
        >
          <MapPin className="mt-0.5 size-4 shrink-0 text-rose-300" aria-hidden />
          <span>
            {r.address}
            <span className="sr-only"> (opens Google Maps in a new tab)</span>
          </span>
        </a>
        {r.website && (
          <a
            href={r.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 self-start rounded text-slate-200 underline decoration-slate-400/50 underline-offset-4 hover:text-slate-50 hover:decoration-slate-200 ${FOCUS_RING}`}
          >
            <Globe className="size-4 shrink-0 text-sky-300" aria-hidden />
            {hostOf(r.website)}
            <ExternalLink className="size-3 shrink-0" aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-300">Verified {formatVerified(r.lastVerified)}</p>
    </motion.li>
  );
}

/** Drawer *content*. HudOverlay owns the container (sidebar or bottom sheet). */
export function RestaurantDrawer({ country, onClose, onMarkVisited }: RestaurantDrawerProps) {
  const filters = useWheelStore((s) => s.filters);
  const [showAll, setShowAll] = useState(false);
  const headingId = useId();
  const matching = matchingRestaurants(country, filters);
  const hiddenCount = country.restaurants.length - matching.length;
  const list = showAll ? country.restaurants : matching;

  return (
    <section aria-labelledby={headingId} className="text-slate-100">
      <header className="flex items-start gap-4">
        <FlagIcon code={country.isoCode} className="mt-1 shrink-0 text-5xl shadow-lg shadow-black/40" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{country.cuisineLabel} cuisine</p>
          <h2
            id={headingId}
            tabIndex={-1}
            data-drawer-heading
            className="mt-0.5 text-2xl font-black leading-tight tracking-tight text-slate-50 outline-none"
          >
            {country.countryName}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {country.restaurants.length} restaurant{country.restaurants.length === 1 ? "" : "s"} in St. Louis
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${country.countryName} details`}
          className={`grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-slate-200 ring-1 ring-white/10 hover:bg-white/10 hover:text-slate-50 ${FOCUS_RING}`}
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <button
        type="button"
        onClick={() => onMarkVisited(country.id)}
        className={[
          "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-[0.95rem] font-black leading-snug text-emerald-950",
          "bg-gradient-to-b from-emerald-300 to-emerald-400 shadow-[0_4px_0_0_#047857]",
          "hover:from-emerald-200 hover:to-emerald-300 active:translate-y-[3px] active:shadow-[0_1px_0_0_#047857]",
          FOCUS_RING,
        ].join(" ")}
      >
        <CircleCheck className="size-5 shrink-0" aria-hidden />
        <span className="text-balance text-center">Mark Visited — Remove from Wheel</span>
      </button>

      {hiddenCount > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10">
          <span>
            {showAll
              ? `Showing all ${country.restaurants.length}`
              : `${matching.length} of ${country.restaurants.length} match your filters`}
          </span>
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
            className={`rounded font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:decoration-amber-300 ${FOCUS_RING}`}
          >
            {showAll ? "Only matching" : `Show all ${country.restaurants.length} restaurants`}
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-3" aria-label={`${country.cuisineLabel} restaurants`}>
        {list.map((r) => (
          <RestaurantCard key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}
