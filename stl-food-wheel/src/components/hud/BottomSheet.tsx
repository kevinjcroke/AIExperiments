import { useCallback, useEffect, useRef, type ReactNode, type Ref } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { trapTab } from "./focus";
import { FOCUS_RING, GLASS } from "./styles";

export type Snap = "peek" | "half" | "full";

/** iPhone home-indicator inset, read once (env() is only resolvable via computed style). */
function safeAreaBottomPx(): number {
  try {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)";
    document.body.appendChild(probe);
    const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    return px;
  } catch {
    return 0;
  }
}

export const SHEET_PEEK_PX = 108 + safeAreaBottomPx();
export const MOBILE_HEADER_PX = 56;

export function sheetMetrics(vh: number) {
  const sheetH = Math.max(SHEET_PEEK_PX + 40, vh - MOBILE_HEADER_PX - 8);
  const y: Record<Snap, number> = {
    full: 0,
    half: Math.max(0, sheetH - Math.round(vh * 0.56)),
    peek: sheetH - SHEET_PEEK_PX,
  };
  return { sheetH, y };
}

export interface BottomSheetProps {
  vh: number;
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  /** Always-visible row (readout + Spin). Acts as the drag handle. */
  peek: ReactNode;
  children: ReactNode;
  /** Modal = focus trapped + backdrop (country open at half/full). */
  modal: boolean;
  ariaLabel: string;
  sheetRef?: Ref<HTMLDivElement>;
}

const ORDER: Snap[] = ["full", "half", "peek"];

export function BottomSheet({ vh, snap, onSnapChange, peek, children, modal, ariaLabel, sheetRef }: BottomSheetProps) {
  const { sheetH, y: snapY } = sheetMetrics(vh);
  const y = useMotionValue(snapY[snap]);
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      localRef.current = el;
      if (typeof sheetRef === "function") sheetRef(el);
      else if (sheetRef) (sheetRef as { current: HTMLDivElement | null }).current = el;
    },
    [sheetRef],
  );

  // Animate to the snap target whenever the snap or viewport changes.
  useEffect(() => {
    const target = snapY[snap];
    if (reduce) {
      y.set(target);
      return;
    }
    const c = animate(y, target, { type: "spring", stiffness: 420, damping: 42, mass: 0.9 });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, vh, reduce]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.18;
    let best: Snap = "peek";
    let bestD = Infinity;
    for (const s of ORDER) {
      const d = Math.abs(snapY[s] - projected);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best === snap) {
      // Same snap: the effect won't re-run, so settle back manually.
      if (reduce) y.set(snapY[best]);
      else animate(y, snapY[best], { type: "spring", stiffness: 420, damping: 42 });
    }
    onSnapChange(best);
    window.setTimeout(() => (dragged.current = false), 0);
  };

  const cycle = () => {
    if (dragged.current) return;
    onSnapChange(snap === "peek" ? "half" : snap === "half" ? "full" : "peek");
  };

  return (
    <>
      <AnimatePresence>
        {modal && (
          <motion.div
            key="backdrop"
            aria-hidden
            className="fixed inset-0 z-30 bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onSnapChange("peek")}
          />
        )}
      </AnimatePresence>
      <motion.div
        ref={setRefs}
        role={modal ? "dialog" : "region"}
        aria-modal={modal || undefined}
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (modal && localRef.current) trapTab(e, localRef.current);
        }}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: snapY.peek }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={onDragEnd}
        style={{ y, height: sheetH }}
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl border-t border-white/15 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.6)] outline-none ${GLASS}`}
      >
        <div
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ height: SHEET_PEEK_PX }}
        >
          <button
            type="button"
            onClick={cycle}
            aria-label={snap === "full" ? "Collapse panel" : "Expand panel"}
            aria-expanded={snap !== "peek"}
            className={`mx-auto flex h-6 w-24 items-center justify-center rounded-full ${FOCUS_RING}`}
          >
            <span className="h-1.5 w-11 rounded-full bg-slate-300/70" />
          </button>
          <div className="px-4 pb-3">{peek}</div>
        </div>
        <div
          inert={snap === "peek"}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/10 px-4 pt-4"
          style={{ paddingBottom: snapY[snap] + 24 }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
