"use client";

import { useOverlayFocus } from "@/shared/hooks/useOverlayFocus";
import styles from "./BottomSheet.module.css";

type BottomSheetProps = {
  /** What a screen reader calls the sheet. */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  /** The design's sheets are 660 tall on a 812 screen; shorter screens cap it under the top. */
  height?: number;
};

/**
 * A tall bottom sheet over a scrim (the design's `SheetOverlay` with the library and block
 * configuration chrome: the teal rule on the top edge and the grabber). Focus moves inside, Tab
 * stays inside, Escape and the scrim close it, focus goes back to whatever opened it.
 */
export default function BottomSheet({ label, onClose, children, height = 660 }: BottomSheetProps) {
  const ref = useOverlayFocus<HTMLDivElement>(onClose);
  return (
    <div className={styles.overlay}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={styles.sheet}
        style={{ height: `min(${height}px, calc(100dvh - 24px))` }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <span className={styles.rule} aria-hidden="true" />
        <span className={styles.grabber} aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
