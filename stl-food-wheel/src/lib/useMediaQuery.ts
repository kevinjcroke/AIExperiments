import { useSyncExternalStore } from "react";

export const DESKTOP_QUERY = "(min-width: 768px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY);
export const usePrefersReducedMotion = () => useMediaQuery(REDUCED_MOTION_QUERY);

/** Non-hook read for use inside useFrame / event handlers. */
export const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return false;
  }
};
