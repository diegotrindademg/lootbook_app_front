import BlockIcon from "@/shared/components/ui/BlockIcon";
import styles from "./Stepper.module.css";

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/** Minus, the number, plus (design `Stepper`). */
export default function Stepper({ label, value, onChange, min = 0, max = 999 }: StepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.minus}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <BlockIcon icon="minus" size={16} />
      </button>
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.plus}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <BlockIcon icon="plus" size={16} />
      </button>
    </div>
  );
}
