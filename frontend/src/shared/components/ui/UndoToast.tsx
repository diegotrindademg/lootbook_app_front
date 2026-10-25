import Icon from "./Icon";
import styles from "./UndoToast.module.css";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
};

/**
 * Reversal for a recoverable action (Figma "Undo toast" 2353:2287). The caller decides how long it
 * stays (Archive: 6 seconds).
 */
export default function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div className={styles.toast} role="status">
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.undo} onClick={onUndo}>
        <Icon name="undo" size={16} />
        Undo
      </button>
      <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
