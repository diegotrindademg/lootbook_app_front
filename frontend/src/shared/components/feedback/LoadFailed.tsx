import { LootbookApiError } from "@/shared/api/lootbookRequest";
import Icon from "@/shared/components/ui/Icon";
import { isOnline } from "@/shared/hooks/useOnline";
import styles from "./LoadFailed.module.css";

export type LoadFailedCause = "offline" | "server";

/** Why a read failed: no network (the device is offline, or the request never got an answer), or the server. */
export function failureCause(error: unknown): LoadFailedCause {
  if (!isOnline()) return "offline";
  return error instanceof LootbookApiError && error.status !== 0 ? "server" : "offline";
}

const TITLE = { list: "Could not load your characters", sheet: "Could not open this sheet" };
const BODY = {
  offline: "You are offline. They will load when you are back, or tap Retry.",
  server: "Something went wrong on our side. Nothing was lost.",
};

/**
 * A read that failed (Figma "Load failed" 2425:37426, page 8 F2, F3, F7, F8): on the list it takes the
 * carousel card's place, 292 x 397 and dashed; on the sheet it is a 335 x 260 card where the blocks would
 * be. The title and body are an alert; Retry (the border button, 44 high) reads again.
 */
export default function LoadFailed({
  context,
  cause,
  onRetry,
  className,
}: {
  context: "list" | "sheet";
  cause: LoadFailedCause;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div className={[styles.card, styles[context], className].filter(Boolean).join(" ")}>
      <Icon
        name={cause === "offline" ? "offline" : "alert"}
        size={32}
        className={cause === "offline" ? styles.offlineIcon : styles.serverIcon}
      />
      <div className={styles.copy} role="alert">
        <p className={styles.title}>{TITLE[context]}</p>
        <p className={styles.body}>{BODY[cause]}</p>
      </div>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
