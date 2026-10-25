import Spinner from "@/shared/components/ui/Spinner";
import styles from "./GhostPill.module.css";

type GhostPillProps = {
  children: React.ReactNode;
  /** teal is the editor's Save; white the small "Add" and "+ Add value" pills. */
  tone?: "teal" | "white";
  disabled?: boolean;
  /** Keeps its skin, shows a spinner and stops taking presses (Save while saving). */
  busy?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
};

/** The 34px pill (design `GhostPill`). */
export default function GhostPill({
  children,
  tone = "white",
  disabled = false,
  busy = false,
  onClick,
  ariaLabel,
  ariaDescribedBy,
}: GhostPillProps) {
  const className = [styles.pill, tone === "teal" ? styles.teal : styles.white, busy && styles.busy]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={onClick}
    >
      {busy && <Spinner size={14} />}
      {children}
    </button>
  );
}
