"use client";

import { useSyncExternalStore } from "react";
import { fakeSwitch } from "@/shared/config/devFakes";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Whether the device has a network, as the browser says (or the dev `?fake=offline` switch). */
export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine && !fakeSwitch("offline");
}

/** `isOnline`, kept current as the browser goes offline and back. True on the server. */
export function useOnline() {
  return useSyncExternalStore(subscribe, isOnline, () => true);
}
