"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/shared/components/ui/Icon";
import { useOnline } from "@/shared/hooks/useOnline";
import styles from "./OfflineBanner.module.css";

export type OfflineBarState = "offline" | "back-online" | null;

/**
 * Whether the offline bar shows, and which state: "offline" while the device is offline, then
 * "back-online" for three seconds once it is back (Figma page 8, O6, O7). A screen that places the bar
 * reads this too, to make room for it.
 */
export function useOfflineBar(): OfflineBarState {
  const online = useOnline();
  const [backOnline, setBackOnline] = useState(false);
  const was = useRef(online);

  useEffect(() => {
    if (was.current === online) return;
    was.current = online;
    if (!online) {
      setBackOnline(false);
      return;
    }
    setBackOnline(true);
    const timer = window.setTimeout(() => setBackOnline(false), 3000);
    return () => window.clearTimeout(timer);
  }, [online]);

  if (!online) return "offline";
  return backOnline ? "back-online" : null;
}

/**
 * The offline banner, Kind=Bar (Figma "Offline banner" 2425:26873, page 8's pick O1 A): full width under
 * the nav bar or the editor header, "You are offline. Changes will not save until you are back."
 * (contract v1.1, 4), then "Back online" in teal for three seconds. Not dismissable. The status region
 * is always in the page, so a screen reader hears both; empty, it takes no room.
 */
export default function OfflineBanner({ state, className }: { state: OfflineBarState; className?: string }) {
  const classes = [styles.region, state && styles.bar, state === "back-online" && styles.back, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} role="status">
      {state === "offline" && (
        <>
          <Icon name="offline" size={18} className={styles.icon} />
          <p className={styles.text}>
            <strong className={styles.lead}>You are offline.</strong> Changes will not save until you are back.
          </p>
        </>
      )}
      {state === "back-online" && (
        <>
          <Icon name="check" size={18} className={styles.backIcon} />
          <p className={`${styles.text} ${styles.backText}`}>Back online</p>
        </>
      )}
    </div>
  );
}
