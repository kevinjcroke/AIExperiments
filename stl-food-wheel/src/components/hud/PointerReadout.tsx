import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { countryById, useWheelStore } from "../../store/wheelStore";
import { FlagIcon } from "../FlagIcon";
import { READOUT_TOP_PX } from "./styles";

/** Country currently under the pointer, falling back to the selected one. */
export function useReadoutCountry() {
  const dataset = useWheelStore((s) => s.dataset);
  const pointerId = useWheelStore((s) => s.pointerId);
  const selectedId = useWheelStore((s) => s.selectedId);
  return countryById(dataset, pointerId ?? selectedId);
}

/** Visible pill under the 12 o'clock pointer. Not a live region (it ticks during spins). */
export function PointerReadout() {
  const country = useReadoutCountry();
  const spinning = useWheelStore((s) => s.phase === "spinning");

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4"
      style={{ top: READOUT_TOP_PX }}
    >
      <div
        className={[
          "flex max-w-full items-center gap-2.5 rounded-full py-2 pl-2.5 pr-4",
          "bg-slate-950/85 shadow-lg shadow-black/40 ring-1 backdrop-blur-md transition-[box-shadow,ring-color]",
          spinning ? "ring-amber-300/70" : "ring-white/15",
        ].join(" ")}
      >
        {country ? (
          <>
            <FlagIcon code={country.isoCode} className="shrink-0 text-xl" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={country.id}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.08 }}
                className="truncate text-base font-bold tracking-tight text-slate-50 sm:text-lg"
              >
                {country.countryName}
              </motion.span>
            </AnimatePresence>
          </>
        ) : (
          <span className="px-1.5 text-sm font-semibold text-slate-200">Spin to pick a country</span>
        )}
      </div>
    </div>
  );
}

/** Visually hidden live region: announces once per spin, when it settles (never per tick). */
export function SettleAnnouncer() {
  const phase = useWheelStore((s) => s.phase);
  const selectedId = useWheelStore((s) => s.selectedId);
  const spinRequestId = useWheelStore((s) => s.spinRequestId);
  const dataset = useWheelStore((s) => s.dataset);
  const [message, setMessage] = useState("");
  const announcedSpin = useRef(0);

  useEffect(() => {
    if (phase === "spinning") {
      setMessage("");
      return;
    }
    if (phase !== "settled" || !selectedId || announcedSpin.current === spinRequestId) return;
    const c = countryById(dataset, selectedId);
    if (!c) return;
    announcedSpin.current = spinRequestId;
    const n = c.restaurants.length;
    setMessage(`The wheel landed on ${c.countryName}. ${c.cuisineLabel} cuisine, ${n} restaurant${n === 1 ? "" : "s"}.`);
  }, [phase, selectedId, spinRequestId, dataset]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
