import BlockIcon, { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import type { SheetBlock } from "../../types";
import { blockSummary } from "../../utils/blocks";
import styles from "./BlockRow.module.css";

type BlockRowProps = {
  block: SheetBlock;
  position: number;
  count: number;
  onConfigure: () => void;
  onTogglePin: () => void;
  /** Pointer and keyboard handlers for the grip (reorder). */
  gripProps?: React.ButtonHTMLAttributes<HTMLButtonElement> & { "data-grip"?: string };
  dragging?: boolean;
};

/** One block in the editor (design `BlockRow`): tap to configure, pin, and the grip to reorder. */
export default function BlockRow({ block, position, count, onConfigure, onTogglePin, gripProps, dragging }: BlockRowProps) {
  const summary = blockSummary(block);
  return (
    <div className={dragging ? `${styles.row} ${styles.dragging}` : styles.row}>
      <button type="button" className={styles.configure} onClick={onConfigure} aria-label={`Configure ${block.title}, ${summary}`}>
        <BlockIconBox icon={block.icon} size={40} />
        <span className={styles.copy}>
          <span className={styles.title}>{block.title}</span>
          <span className={styles.summary}>{summary}</span>
        </span>
      </button>
      <button
        type="button"
        className={block.pinned ? `${styles.pin} ${styles.pinned}` : styles.pin}
        aria-label={`Pin ${block.title} to quick access`}
        aria-pressed={block.pinned}
        onClick={onTogglePin}
      >
        <BlockIcon icon="pin" size={18} />
      </button>
      <button
        type="button"
        className={styles.grip}
        aria-label={`Move ${block.title}, ${position} of ${count}`}
        aria-describedby="block-move-help"
        {...gripProps}
      >
        <BlockIcon icon="grip" size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
