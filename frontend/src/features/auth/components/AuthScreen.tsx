import GoblinSymbol from "@/assets/goblinsymbol.svg";
import LootbookLogo from "@/assets/lootbook-logo-horizontal.svg";
import OfflineBanner, { useOfflineBar } from "@/shared/components/feedback/OfflineBanner";
import AppColumn from "@/shared/components/layout/AppColumn";
import Icon from "@/shared/components/ui/Icon";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import type { AuthNotice } from "../utils/authNotices";
import styles from "./AuthScreen.module.css";

type AuthScreenProps = {
  /** goblin: the brand mark; mail and check: the waiting-room circles. */
  badge?: "goblin" | "mail" | "check";
  title: string;
  subtitle?: React.ReactNode;
  /** The reassurance chip under the copy, shown only when a draft is waiting. */
  reassurance?: string | null;
  error?: AuthNotice | null;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
};

/**
 * The frame every sign-in screen shares (design 05.x): back button, badge, title, one line of
 * framing, then the screen's own body. With an error the badge and chip step aside so the problem
 * leads and the main button stays in view.
 * WAITING ON THE WIDE DESIGN: the plan's decision is a centred phone-width card at wide.
 */
export default function AuthScreen({
  badge = "goblin",
  title,
  subtitle,
  reassurance,
  error,
  backLabel,
  onBack,
  children,
}: AuthScreenProps) {
  const compact = Boolean(error);
  const offlineBar = useOfflineBar();

  return (
    <AppColumn size="page" className={offlineBar ? `${styles.page} ${styles.offline}` : styles.page}>
      {/* Page 8, O5: no nav bar here, so the offline bar sits at the top and the screen moves down. */}
      <OfflineBanner state={offlineBar} className={offlineBar ? styles.offlineBar : undefined} />
      {/* Wide (Figma page 2 wide frames): the logo top left, the screen as a centred 375 card. */}
      <LootbookLogo className={styles.logo} role="img" aria-label="Lootbook" />
      <div className={styles.card}>
        <button type="button" className={styles.back} aria-label={backLabel} onClick={onBack}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <main className={compact ? `${styles.well} ${styles.compact}` : styles.well}>
          {!compact && (
            <div className={styles.badgeRow} aria-hidden="true">
              {badge === "goblin" ? (
                // The SVG loader drops the viewBox, so it is given back here to let the mark scale.
                <GoblinSymbol className={styles.goblin} viewBox="0 0 48 42" />
              ) : (
                <span className={styles.circle}>
                  <Icon name={badge} size={30} />
                </span>
              )}
            </div>
          )}
          <div className={styles.copy}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            {reassurance && !compact && (
              <p className={styles.chip}>
                <Icon name="check" size={14} />
                {reassurance}
              </p>
            )}
          </div>
          {error && (
            <InlineNotice
              title={error.title}
              body={error.body}
              actionLabel={error.actionLabel}
              onAction={error.onAction}
            />
          )}
          <div className={styles.body}>{children}</div>
        </main>
      </div>
    </AppColumn>
  );
}

/** Copy-weight emphasis inside a subtitle: the email or the draft's name. */
export function Strong({ children }: { children: React.ReactNode }) {
  return <span className={styles.strong}>{children}</span>;
}

/** A link-styled button: teal for a way forward, muted for a way back. */
export function TextButton({
  children,
  tone = "accent",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={tone === "muted" ? `${styles.textButton} ${styles.muted}` : styles.textButton}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/** A row of text and text buttons under the fields; `end` pushes it to the right. */
export function AuthRow({ children, end = false }: { children: React.ReactNode; end?: boolean }) {
  return <div className={end ? `${styles.row} ${styles.rowEnd}` : styles.row}>{children}</div>;
}

/** Plain muted text beside a text button ("Already have an account?"). */
export function AuthRowText({ children }: { children: React.ReactNode }) {
  return <span className={styles.rowText}>{children}</span>;
}

/** The stack of fields. */
export function AuthFields({ children }: { children: React.ReactNode }) {
  return <div className={styles.fields}>{children}</div>;
}

/** The screen's form: Enter submits, the browser's own checks are off (the screen shows its own). */
export function AuthForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) {
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
