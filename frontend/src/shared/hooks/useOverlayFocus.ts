"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Each open overlay and the control that opened it, so an overlay opened from a menu (a dialog
 * chosen from the card menu) hands focus back to the original control, not to the vanished item.
 * An overlay opened from a control that stays (a second sheet's pen, a choice in a sheet) hands it
 * back to that control. */
const openers = new WeakMap<Element, HTMLElement | null>();

function resolveOpener(): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null;
  const parentOverlay = active?.closest("[data-overlay-root]");
  return parentOverlay && active?.closest('[role="menu"]') ? (openers.get(parentOverlay) ?? null) : active;
}

/**
 * Keyboard behaviour shared by sheets and dialogs: focus moves inside when it opens, Tab stays
 * inside, Escape closes, and focus goes back to whatever opened it.
 */
export function useOverlayFocus<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Read during the first render: by the time effects run, the page behind may already be inert,
  // which takes focus away from the control that opened the overlay.
  const openerRef = useRef(typeof document === "undefined" ? null : resolveOpener());

  useEffect(() => {
    const opener = openerRef.current;
    const root = ref.current;
    if (!root) return;
    root.setAttribute("data-overlay-root", "");
    openers.set(root, opener);

    const autoFocus = root.querySelector<HTMLElement>("[data-autofocus]");
    (autoFocus ?? root.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      // Wait a tick: the page behind is still inert while this overlay is being removed.
      window.setTimeout(() => {
        if (opener && document.contains(opener) && !opener.closest("[inert]")) opener.focus();
      });
    };
  }, []);

  return ref;
}
