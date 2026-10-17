import { useEffect, type RefObject } from "react";
import { spinFromGesture } from "./SpinButton";

const INTERACTIVE = "button, a[href], input, select, textarea, summary, [role='button'], [contenteditable='true']";

/**
 * Global Space-to-spin. Only fires when focus is on <body>, the canvas, or a
 * non-interactive element inside the stage, so focused buttons keep native Space.
 */
export function useSpinShortcut(stageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.code !== "Space") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const a = document.activeElement;
      const eligible =
        !a ||
        a === document.body ||
        a.tagName === "CANVAS" ||
        (stageRef.current?.contains(a) === true && !a.closest(INTERACTIVE));
      if (!eligible) return;
      e.preventDefault();
      if (e.repeat) return;
      spinFromGesture();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stageRef]);
}
