import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Keyboard } from "lucide-react";
import { countryById, useActiveCountries, useWheelStore } from "../store/wheelStore";
import { useIsDesktop } from "../lib/useMediaQuery";
import { RestaurantDrawer } from "./RestaurantDrawer";
import { FlagIcon } from "./FlagIcon";
import { SpinButton } from "./hud/SpinButton";
import { MuteButton } from "./hud/MuteButton";
import { Title } from "./hud/Title";
import { PointerReadout, SettleAnnouncer, useReadoutCountry } from "./hud/PointerReadout";
import { FilterPanel } from "./hud/FilterPanel";
import { EliminatedList } from "./hud/EliminatedList";
import { StageEmptyState } from "./hud/StageEmptyState";
import { UndoToast, type ToastState } from "./hud/UndoToast";
import { BottomSheet, MOBILE_HEADER_PX, SHEET_PEEK_PX, type Snap } from "./hud/BottomSheet";
import { useSpinShortcut } from "./hud/useSpinShortcut";
import { useViewportHeight } from "./hud/useViewportHeight";
import { isFocusable } from "./hud/focus";
import { GLASS, READOUT_TOP_PX } from "./hud/styles";

declare global {
  interface Window {
    /** Dev-only handle for driving the store from devtools / Playwright. */
    __wheelStore?: typeof useWheelStore;
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") window.__wheelStore = useWheelStore;

export interface HudOverlayProps {
  /** The 3D canvas (<WheelScene/>). HudOverlay owns the responsive layout around it. */
  stage: ReactNode;
}

const TOAST_MS = 5000;

const STAGE_BG =
  "bg-[radial-gradient(ellipse_at_50%_45%,#1e293b_0%,#0f172a_45%,#020617_100%)]";

/** HUD, filters, eliminated list, drawer container, toasts. */
export function HudOverlay({ stage }: HudOverlayProps) {
  const isDesktop = useIsDesktop();
  const vh = useViewportHeight();
  const dataset = useWheelStore((s) => s.dataset);
  const selectedId = useWheelStore((s) => s.selectedId);
  const phase = useWheelStore((s) => s.phase);
  const select = useWheelStore((s) => s.select);
  const eliminate = useWheelStore((s) => s.eliminate);
  const restore = useWheelStore((s) => s.restore);
  const country = countryById(dataset, selectedId);

  const stageRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const spinRef = useRef<HTMLButtonElement | null>(null);
  const returnFocus = useRef<Element | null>(null);

  const [snap, setSnap] = useState<Snap>("peek");
  const [toast, setToast] = useState<ToastState | null>(null);

  const modal = !isDesktop && !!country && snap !== "peek";

  useSpinShortcut(stageRef);

  const close = useCallback(() => select(null), [select]);

  const markVisited = useCallback(
    (id: string) => {
      const c = countryById(useWheelStore.getState().dataset, id);
      eliminate(id); // store nulls selectedId when it falls off the wheel
      select(null);
      if (c) setToast({ key: Date.now(), countryId: id, countryName: c.countryName });
    },
    [eliminate, select],
  );

  const undo = useCallback(
    (id: string) => {
      restore(id);
      setToast(null);
    },
    [restore],
  );

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Esc closes the drawer (desktop + mobile).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, select]);

  // Mobile sheet collapses while spinning, and when the last country leaves the
  // wheel (so the "eaten your way around the world" card is visible).
  useEffect(() => {
    if (phase === "spinning") setSnap("peek");
  }, [phase]);
  const allEliminated = useWheelStore((s) => s.eliminatedIds.length >= s.dataset.countries.length);
  useEffect(() => {
    if (allEliminated) setSnap("peek");
  }, [allEliminated]);

  // On selection change: open the sheet to half / collapse it, and manage focus
  // (remember where it was on open; restore sensibly on close).
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSelected.current;
    prevSelected.current = selectedId;
    if (selectedId && selectedId !== prev) setSnap("half");
    if (!selectedId && prev) setSnap("peek");
    if (selectedId && !prev) {
      const a = document.activeElement;
      returnFocus.current = a && !drawerRef.current?.contains(a) ? a : null;
      return;
    }
    if (!selectedId && prev) {
      if (useWheelStore.getState().phase === "spinning") return;
      const a = document.activeElement;
      const lost = !a || a === document.body || drawerRef.current?.contains(a);
      if (!lost) return;
      const target = isFocusable(returnFocus.current) ? returnFocus.current : spinRef.current;
      returnFocus.current = null;
      requestAnimationFrame(() => {
        if (isFocusable(target)) target.focus({ preventScroll: true });
      });
    }
  }, [selectedId]);

  // Modal sheet: move focus into it.
  useEffect(() => {
    if (!modal) return;
    const id = requestAnimationFrame(() => {
      const root = drawerRef.current;
      if (!root || root.contains(document.activeElement)) return;
      const heading = root.querySelector<HTMLElement>("[data-drawer-heading]");
      (heading ?? root).focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [modal, selectedId]);

  const drawer = country ? (
    <RestaurantDrawer key={country.id} country={country} onClose={close} onMarkVisited={markVisited} />
  ) : null;

  const panel = (
    <div className="space-y-8">
      <FilterPanel showCount={isDesktop} />
      <div className="h-px bg-white/10" />
      <EliminatedList />
    </div>
  );

  const stageLayer = (
    <>
      <div className="absolute inset-0">{stage}</div>
      <PointerReadout top={isDesktop ? READOUT_TOP_PX.desktop : READOUT_TOP_PX.mobile} />
      <StageEmptyState />
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <SettleAnnouncer />
      {isDesktop ? (
        <div className="flex h-dvh w-full overflow-hidden bg-slate-950 text-slate-100">
          <main
            ref={stageRef}
            aria-label="Food wheel"
            className={`relative min-w-0 flex-1 overflow-hidden ${STAGE_BG}`}
          >
            {stageLayer}
            <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex flex-col items-center gap-2">
              <div className="pointer-events-auto">
                <SpinButton ref={spinRef} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-300">
                <Keyboard className="size-3.5" aria-hidden />
                or press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-slate-100 ring-1 ring-white/15">Space</kbd>
              </p>
            </div>
            <UndoToast toast={toast} onUndo={undo} className="absolute inset-x-0 bottom-36 z-30" />
          </main>

          <aside
            aria-label="Wheel controls"
            className={`flex w-[340px] shrink-0 flex-col border-l border-white/10 lg:w-[400px] ${GLASS}`}
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
              <Title className="text-2xl" />
              <MuteButton />
            </header>
            <div ref={drawerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <AnimatePresence mode="wait" initial={false}>
                {country ? (
                  <motion.div
                    key={`drawer-${country.id}`}
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 32 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  >
                    {drawer}
                  </motion.div>
                ) : (
                  <motion.div
                    key="panel"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.18 }}
                  >
                    {panel}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      ) : (
        <div className="relative h-dvh w-full overflow-hidden bg-slate-950 text-slate-100">
          <header
            inert={modal}
            className="flex items-center justify-between gap-3 px-4"
            style={{ height: MOBILE_HEADER_PX }}
          >
            <Title className="text-lg" />
            <MuteButton />
          </header>
          <main
            ref={stageRef}
            inert={modal}
            aria-label="Food wheel"
            className={`relative w-full overflow-hidden ${STAGE_BG}`}
            style={{ height: Math.max(200, vh - MOBILE_HEADER_PX - SHEET_PEEK_PX + 16) }}
          >
            {stageLayer}
          </main>
          <UndoToast
            toast={toast}
            onUndo={undo}
            className="fixed inset-x-0 z-50"
            style={{ bottom: SHEET_PEEK_PX + 12 }}
          />
          <BottomSheet
            vh={vh}
            snap={snap}
            onSnapChange={setSnap}
            modal={modal}
            ariaLabel={country ? `${country.countryName} restaurants` : "Wheel controls"}
            sheetRef={drawerRef}
            peek={<MobilePeek spinRef={spinRef} />}
          >
            {drawer ?? panel}
          </BottomSheet>
        </div>
      )}
    </MotionConfig>
  );
}

function MobilePeek({ spinRef }: { spinRef: Ref<HTMLButtonElement> }) {
  const country = useReadoutCountry();
  const active = useActiveCountries().length;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1" aria-hidden>
        {country ? (
          <div className="flex min-w-0 items-center gap-2">
            <FlagIcon code={country.isoCode} className="shrink-0 text-xl" />
            <span className="truncate text-base font-bold text-slate-50">{country.countryName}</span>
          </div>
        ) : (
          <p className="text-base font-bold text-slate-50">Ready to spin?</p>
        )}
        <p className="mt-0.5 text-sm text-slate-300">
          <span className="font-bold tabular-nums text-slate-100">{active}</span>{" "}
          {active === 1 ? "country" : "countries"} on the wheel
        </p>
      </div>
      <SpinButton ref={spinRef} size="md" />
    </div>
  );
}
