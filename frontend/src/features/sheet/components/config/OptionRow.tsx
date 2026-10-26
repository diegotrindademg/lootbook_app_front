import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import RoundButton from "../controls/RoundButton";
import styles from "./OptionRow.module.css";

type OptionRowProps = {
  name: string;
  /** A second line under the name: an option's description, or "Uses <attribute>" on an item. */
  detail?: string;
  /** An image link; shown as a 40 thumbnail when set. */
  art?: string;
  picked?: boolean;
  /** Tapping the name picks the option. Without it the name is not a button. */
  onPick?: () => void;
  pickLabel?: string;
  /** A box to tick before the name (a List whose items can be trained). */
  check?: { checked: boolean; label: string; onToggle: () => void };
  /** A value pill before the pen ("+6"). */
  value?: string;
  editLabel: string;
  onEdit: () => void;
  removeLabel: string;
  onRemove: () => void;
};

/**
 * One option or item in a configuration sheet (Figma "Config / Option row"): tap the name to pick it,
 * the pen to open its editor, x to remove. Picked: a teal border and a check; with details, the art
 * and the description on one line.
 */
export default function OptionRow({
  name,
  detail,
  art,
  picked = false,
  onPick,
  pickLabel,
  check,
  value,
  editLabel,
  onEdit,
  removeLabel,
  onRemove,
}: OptionRowProps) {
  const copy = (
    <>
      <span className={styles.name}>{name}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </>
  );
  return (
    <div className={[styles.row, picked && styles.picked, art && styles.withArt].filter(Boolean).join(" ")}>
      {check && (
        <button
          type="button"
          role="checkbox"
          aria-checked={check.checked}
          aria-label={check.label}
          className={check.checked ? `${styles.check} ${styles.checked}` : styles.check}
          onClick={check.onToggle}
        >
          {check.checked && <Icon name="check" size={14} strokeWidth={3} />}
        </button>
      )}
      {art && (
        // eslint-disable-next-line @next/next/no-img-element -- a link the user typed, any host
        <img className={styles.art} src={art} alt="" />
      )}
      {onPick ? (
        <button type="button" className={styles.copy} onClick={onPick} aria-pressed={picked} aria-label={pickLabel}>
          {copy}
        </button>
      ) : (
        <span className={styles.copy}>{copy}</span>
      )}
      {picked && <Icon name="check" size={18} className={styles.pickedMark} />}
      {value && <span className={styles.value}>{value}</span>}
      <button type="button" className={styles.round} aria-label={editLabel} onClick={onEdit}>
        <BlockIcon icon="pen" size={14} />
      </button>
      <RoundButton icon="close" label={removeLabel} onClick={onRemove} />
    </div>
  );
}
