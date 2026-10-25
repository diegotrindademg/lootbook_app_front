"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import styles from "./UndoToast.module.css";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** How long it stays (Archive: 6 seconds), then onDismiss runs. */
  durationMs: number;
};

/**
 * Reversal for a recoverable action (Figma "Undo toast" 2353:2287). The countdown pauses while the
 * toast has keyboard focus or the pointer is over it, and resumes when both leave, so there is time
 * to reach Undo.
 */
export default function UndoToast({ message, onUndo, onDismiss, durationMs }: UndoToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(durationMs);
  const rootRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Native listeners: React's synthetic pointer enter can miss a pointer that arrives as the card
  // under it disappears (Archive removes it), which is exactly when the toast appears.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    if (root.matches(":hover")) setHovered(true);
    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  useEffect(() => {
    if (hovered || focused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismissRef.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [hovered, focused]);

  return (
    <div
      ref={rootRef}
      className={styles.toast}
      role="status"
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.undo} onClick={onUndo}>
        <Icon name="undo" size={16} />
        Undo
      </button>
      <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
