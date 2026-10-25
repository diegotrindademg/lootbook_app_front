"use client";

import { useOverlayFocus } from "@/shared/hooks/useOverlayFocus";
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
};

/** A bottom sheet of actions over a scrim (design 01.3). Choosing an action closes it first. */
export default function ActionSheet({ title, actions, onClose }: ActionSheetProps) {
  const sheetRef = useOverlayFocus<HTMLDivElement>(onClose);

  return (
    <div className={styles.overlay}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.grabber} aria-hidden="true" />
        <p className={styles.title}>{title}</p>
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
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
