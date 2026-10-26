"use client";

import { useSyncExternalStore } from "react";

/**
 * Where the wide layout starts (Figma's wide frames are 1440 x 1024; `--breakpoint-desktop` is 1024).
 * Below it every screen keeps the phone layout in a centred column.
 */
export const WIDE_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True at wide widths, for the layout changes CSS alone cannot make (a grid instead of a carousel). */
export function useWide() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}
