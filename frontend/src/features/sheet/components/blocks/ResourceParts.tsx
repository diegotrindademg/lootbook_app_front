import BlockIcon from "@/shared/components/ui/BlockIcon";
import styles from "./ResourceParts.module.css";

type StepButtonProps = {
  kind: "minus" | "plus";
  /** 36 on a block, 32 on a strip gauge, 26 in a strip tile; the touch target is always 44. */
  size?: number;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

/** The round minus and plus at the table (design `StepButton`). */
export function StepButton({ kind, size = 36, label, disabled, onClick }: StepButtonProps) {
  return (
    <button
      type="button"
      className={kind === "plus" ? `${styles.step} ${styles.plus}` : `${styles.step} ${styles.minus}`}
      style={{ width: size, height: size }}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <BlockIcon icon={kind} size={Math.round(size * 0.5)} strokeWidth={2.5} />
    </button>
  );
}

/** The bar of a gauge (design `Gauge`): green-blue fill with a glow, 220ms. */
export function Gauge({ current, max, height = 8 }: { current: number; max: number; height?: number }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className={styles.gauge} style={{ height }} aria-hidden="true">
      <div className={styles.gaugeFill} style={{ width: `${percent}%` }} />
    </div>
  );
}

type PipsProps = {
  label: string;
  current: number;
  max: number;
  size?: number;
  gap?: number;
  /** Tapping pip i empties it if filled, else fills up to it. Without this the pips only show. */
  onSet?: (next: number) => void;
};

/**
 * A row of pips (design `Pips`). Each pip is a button whose touch target is 44 tall and as wide as
 * the pitch (pip plus gap), so neighbours never overlap.
 */
export function Pips({ label, current, max, size = 18, gap = 8, onSet }: PipsProps) {
  const pips = Array.from({ length: Math.max(0, max) }, (_, i) => i);
  if (!onSet) {
    return (
      <div className={styles.pips} style={{ gap }} role="img" aria-label={`${label}: ${current} of ${max}`}>
        {pips.map((i) => (
          <span key={i} className={i < current ? `${styles.pip} ${styles.filled}` : styles.pip} style={{ width: size, height: size }} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.pips} style={{ gap }} role="group" aria-label={`${label}: ${current} of ${max}`}>
      {pips.map((i) => (
        <button
          key={i}
          type="button"
          className={styles.pipButton}
          style={{ width: size, height: size, ["--pitch" as string]: `${size + gap}px` }}
          aria-label={`${label} ${i + 1} of ${max}`}
          aria-pressed={i < current}
          onClick={() => onSet(i < current ? i : i + 1)}
        >
          <span className={i < current ? `${styles.pip} ${styles.filled}` : styles.pip} style={{ width: size, height: size }} />
        </button>
      ))}
    </div>
  );
}
