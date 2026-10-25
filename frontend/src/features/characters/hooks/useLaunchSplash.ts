"use client";

import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "lootbook.splashSeen";
const SPLASH_MS = 1400;

/**
 * The splash shows once per visit (per browser tab session), then advances on its own after 1.4s,
 * or at once on a tap. "deciding" lasts one frame on the client, so a return visit never flashes it.
 */
export function useLaunchSplash() {
  const [phase, setPhase] = useState<"deciding" | "showing" | "done">("deciding");

  const finish = useCallback(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: the splash shows again next visit.
    }
    setPhase("done");
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) {
      setPhase("done");
      return;
    }
    setPhase("showing");
    const timer = window.setTimeout(finish, SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return { phase, skip: finish };
}
