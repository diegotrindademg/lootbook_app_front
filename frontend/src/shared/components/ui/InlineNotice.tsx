import Icon from "./Icon";
import styles from "./InlineNotice.module.css";

type InlineNoticeProps = {
  tone?: "error" | "info" | "success";
  title?: React.ReactNode;
  body?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const TONE_ICON = { error: "alert", info: "eye", success: "check" } as const;

/** A failure or confirmation that must stay on screen, never a toast. Opaque on purpose. */
export default function InlineNotice({
  tone = "error",
  title,
  body,
  actionLabel,
  onAction,
}: InlineNoticeProps) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === "error" ? "alert" : "status"}>
      <span className={styles.icon}>
        <Icon name={TONE_ICON[tone]} size={18} />
      </span>
      <div className={styles.copy}>
        {title && <p className={styles.title}>{title}</p>}
        {body && <p className={styles.body}>{body}</p>}
      </div>
      {actionLabel && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
