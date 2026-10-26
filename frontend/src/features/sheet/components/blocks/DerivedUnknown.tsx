"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DerivedUnknown.module.css";

/**
 * A derived value that cannot be worked out (contract 3; page 8, G1 and G2): the pill shows "?", 18 high
 * with a 44 hit area, named "Might modifier, could not be worked out". A tap opens the note (Figma
 * "Derived note" 2425:37447, role status) beside it; any tap or Escape closes it.
 */
export default function DerivedUnknown({ label }: { label: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // Added after the tap that opened it, so that tap does not close it again.
    const timer = window.setTimeout(() => document.addEventListener("pointerdown", close), 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [at]);

  const toggle = () => {
    if (at) return setAt(null);
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 260;
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 16);
    const below = rect.bottom + 8;
    setAt({ left, top: below + 80 > window.innerHeight ? rect.top - 88 : below });
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={styles.pill}
        aria-label={`${label}, could not be worked out`}
        aria-expanded={Boolean(at)}
        onClick={toggle}
      >
        ?
      </button>
      {at &&
        createPortal(
          <div className={styles.note} style={at} role="status">
            <p className={styles.title}>Could not work this out</p>
            <p className={styles.body}>{label} needs a number in its formula. Fix it in Edit.</p>
          </div>,
          document.body,
        )}
    </>
  );
}
