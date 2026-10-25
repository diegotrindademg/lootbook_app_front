import styles from "./Toggle.module.css";

type ToggleProps = { on: boolean; onChange: (on: boolean) => void; label: string };

/** A 44 x 26 switch (design `Toggle`). */
export default function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={on ? `${styles.toggle} ${styles.on}` : styles.toggle}
      onClick={() => onChange(!on)}
    >
      <span className={styles.knob} />
    </button>
  );
}
