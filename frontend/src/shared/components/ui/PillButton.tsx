import Spinner from "./Spinner";
import styles from "./PillButton.module.css";

type PillButtonProps = {
  children: React.ReactNode;
  /** gradient is the primary action, flat the secondary one. */
  variant?: "gradient" | "flat";
  type?: "button" | "submit";
  /** Keeps its skin, shows a spinner and stops taking presses while the action runs. */
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

/** The full-width 48px pill used for the main actions (the design system's BuilderStepFooter skins). */
export default function PillButton({
  children,
  variant = "gradient",
  type = "button",
  busy = false,
  disabled = false,
  onClick,
}: PillButtonProps) {
  const className = [
    styles.pill,
    variant === "flat" ? styles.flat : styles.gradient,
    busy && styles.busy,
    disabled && !busy && styles.disabled,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      {busy && <Spinner size={18} />}
      {children}
    </button>
  );
}
