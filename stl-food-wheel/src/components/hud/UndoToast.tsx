import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck } from "lucide-react";
import { FOCUS_RING } from "./styles";

export interface ToastState {
  key: number;
  countryId: string;
  countryName: string;
}

/** Always-mounted role="status" region so screen readers pick up new toasts. */
export function UndoToast({
  toast,
  onUndo,
  className = "",
  style,
}: {
  toast: ToastState | null;
  onUndo: (countryId: string) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div role="status" aria-live="polite" style={style} className={`pointer-events-none flex justify-center px-4 ${className}`}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="pointer-events-auto relative flex max-w-full items-center gap-3 rounded-2xl bg-slate-800/95 py-2.5 pl-3.5 pr-2.5 text-sm text-slate-100 shadow-2xl shadow-black/50 ring-1 ring-white/15 backdrop-blur-md"
          >
            <CircleCheck className="size-5 shrink-0 text-emerald-300" aria-hidden />
            <span className="min-w-0">
              <strong className="font-bold text-slate-50">{toast.countryName}</strong> marked visited
            </span>
            <button
              type="button"
              onClick={() => onUndo(toast.countryId)}
              className={`shrink-0 rounded-full bg-amber-300 px-3.5 py-1.5 font-bold text-slate-950 hover:bg-amber-200 ${FOCUS_RING}`}
            >
              Undo
            </button>
            <motion.span
              aria-hidden
              className="absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full bg-amber-300/60"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
