"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/shared/components/ui/Icon";
import { useOnline } from "@/shared/hooks/useOnline";
import styles from "./OfflineBanner.module.css";

/**
 * The offline banner (contract 3 and v1.1, 4): while the device is offline, "You are offline. Changes
 * will not save until you are back."; when it comes back, "Back online" for three seconds. On every
 * screen, signed in or not. The live region is always there, so a screen reader hears both.
 * WAITING ON DESIGN: 8. A plain pill above the tab bar (at wide, at the foot of the page) until page 8
 * lands with its part and its tagged position.
 */
export default function OfflineBanner() {
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

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {!online && (
        <p className={styles.banner}>
          <Icon name="alert" size={18} className={styles.offlineIcon} />
          You are offline. Changes will not save until you are back.
        </p>
      )}
      {online && backOnline && (
        <p className={styles.banner}>
          <Icon name="check" size={18} className={styles.onlineIcon} />
          Back online
        </p>
      )}
    </div>
  );
}
