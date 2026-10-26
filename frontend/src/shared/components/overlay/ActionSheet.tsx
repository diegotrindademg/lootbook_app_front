"use client";

import { useOverlayFocus } from "@/shared/hooks/useOverlayFocus";
import { useWide } from "@/shared/hooks/useWide";
import Icon, { type IconName } from "@/shared/components/ui/Icon";
import styles from "./ActionSheet.module.css";

export type SheetAction = {
  label: string;
  icon: IconName;
  destructive?: boolean;
  onSelect: () => void;
};

type ActionSheetProps = {
  title: string;
  actions: SheetAction[];
  onClose: () => void;
  /** The control that opened it: at wide the actions open as a popover beside it. */
  anchor?: DOMRect | null;
};

const POPOVER_WIDTH = 260;

/**
 * A bottom sheet of actions over a scrim (design 01.3). Choosing an action closes it first.
 * At wide, with an anchor, the same actions open as a popover beside the control (Figma "S5 · Card
 * menu · wide", "Menu popover" 260 wide), closed by Escape or a click outside.
 */
export default function ActionSheet({ title, actions, onClose, anchor }: ActionSheetProps) {
  const sheetRef = useOverlayFocus<HTMLDivElement>(onClose);
  const wide = useWide();

  const items = (
    <div className={styles.actions} role="menu" aria-label={title}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          className={action.destructive ? `${styles.action} ${styles.destructive}` : styles.action}
          onClick={() => {
            onClose();
            action.onSelect();
          }}
        >
          <Icon name={action.icon} size={18} className={styles.actionIcon} />
          {action.label}
        </button>
      ))}
    </div>
  );

  if (wide && anchor) {
    const fitsRight = anchor.right + 8 + POPOVER_WIDTH <= window.innerWidth - 16;
    const left = fitsRight ? anchor.right + 8 : Math.max(16, anchor.left - 8 - POPOVER_WIDTH);
    return (
      <div className={styles.popoverLayer}>
        <div className={styles.clickAway} onClick={onClose} aria-hidden="true" />
        <div
          ref={sheetRef}
          className={styles.popover}
          style={{ top: Math.max(16, anchor.top - 2), left }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {items}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.grabber} aria-hidden="true" />
        <p className={styles.title}>{title}</p>
        {items}
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
