"use client";

import { createPortal } from "react-dom";
import { useOverlayFocus } from "@/shared/hooks/useOverlayFocus";
import styles from "./BottomSheet.module.css";

type BottomSheetProps = {
  /** What a screen reader calls the sheet. */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  /** The design's sheets are 660 tall on a 812 screen (716 for a second sheet); shorter screens cap it. */
  height?: number;
  /** A second sheet over the first (the option, item and derived value editors): no teal rule. */
  second?: boolean;
};

/**
 * A tall bottom sheet over a scrim (the design's `SheetOverlay` with the library and block
 * configuration chrome: the teal rule on the top edge and the grabber). Focus moves inside, Tab
 * stays inside, Escape and the scrim close it, focus goes back to whatever opened it.
 * Rendered at the end of the page so a second sheet opened from inside the first stacks above it
 * and is not held inside the first sheet's moving box.
 */
export default function BottomSheet({ label, onClose, children, height = 660, second = false }: BottomSheetProps) {
  const ref = useOverlayFocus<HTMLDivElement>(onClose);
  const sheet = (
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
        {!second && <span className={styles.rule} aria-hidden="true" />}
        <span className={styles.grabber} aria-hidden="true" />
        {children}
      </div>
    </div>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}
