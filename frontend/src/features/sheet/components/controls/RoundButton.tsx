import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import styles from "./RoundButton.module.css";

type RoundButtonProps = {
  label: string;
  icon: "close" | "chevronDown";
  onClick: () => void;
  /** For a disclosure: whether what it opens is open. */
  expanded?: boolean;
  controls?: string;
};

/** The 28px circle beside an option, value or item: remove, or open its details. */
export default function RoundButton({ label, icon, onClick, expanded, controls }: RoundButtonProps) {
  return (
    <button
      type="button"
      className={expanded ? `${styles.round} ${styles.open}` : styles.round}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      {icon === "close" ? <Icon name="close" size={12} /> : <BlockIcon icon="chevronDown" size={16} />}
    </button>
  );
}
