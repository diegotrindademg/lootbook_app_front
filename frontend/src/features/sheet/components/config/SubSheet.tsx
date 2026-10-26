import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import BottomSheet from "@/shared/components/overlay/BottomSheet";
import PillButton from "@/shared/components/ui/PillButton";
import styles from "./SubSheet.module.css";

type SubSheetProps = {
  /** The thing being edited, as the head's title ("Shieldbreaker"). */
  title: string;
  /** What it is, in the head's caption ("Option", "Item", "Derived value"). */
  kind: string;
  removeLabel: string;
  onRemove: () => void;
  onDone: () => void;
  children: React.ReactNode;
};

/**
 * A second sheet over the block configuration, for one option, item or derived value (Figma page 5,
 * C3 A, L3 A, T14 A): 716 tall, a back button, the name and what it is in the head, the fields, and
 * Remove and Done in the foot. Back and Done both close it; every change applies at once.
 */
export default function SubSheet({ title, kind, removeLabel, onRemove, onDone, children }: SubSheetProps) {
  return (
    <BottomSheet label={`${kind}: ${title || "untitled"}`} onClose={onDone} height={716} second>
      <div className={styles.sub}>
        <div className={styles.head}>
          <button type="button" className={styles.back} aria-label="Back" onClick={onDone}>
            <Icon name="chevronLeft" size={22} />
          </button>
          <h2 className={styles.title}>{title || " "}</h2>
          <span className={styles.kind}>{kind}</span>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.foot}>
          <button type="button" className={styles.remove} onClick={onRemove}>
            <BlockIcon icon="trash" size={16} />
            {removeLabel}
          </button>
          <div className={styles.done}>
            <PillButton onClick={onDone}>Done</PillButton>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
