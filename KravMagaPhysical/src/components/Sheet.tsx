import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/** Native <dialog>: bottom sheet on phones, drawer from the right at 960 px and up. Esc and the backdrop close it. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      // Escape: close through React state instead of natively, so state and dialog can't disagree
      // (some browsers close on Escape without ever firing "close").
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="flex max-h-[90dvh] w-full flex-col rounded-t-xl border border-line bg-sheet shadow-[0_-24px_70px_rgb(0_0_0/0.65)] min-[960px]:h-dvh min-[960px]:max-h-none min-[960px]:rounded-none">
          <div className="flex flex-none flex-col gap-1.5 border-b border-surface-3 px-4 pt-2 pb-3">
            <span aria-hidden="true" className="h-1 w-10 self-center rounded-[2px] bg-line-strong min-[960px]:hidden" />
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="m-0 font-display text-[26px] font-extrabold tracking-[0.06em] uppercase">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title.toLowerCase()}`}
                className="btn flex size-11 items-center justify-center rounded-[12px] border border-line-strong bg-surface-2"
              >
                <X className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-4 pt-3.5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">{children}</div>
        </div>
      )}
    </dialog>
  );
}
