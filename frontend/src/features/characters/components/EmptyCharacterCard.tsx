import Link from "next/link";
import Icon from "@/shared/components/ui/Icon";
import styles from "./EmptyCharacterCard.module.css";

type EmptyCharacterCardProps = {
  label: string;
  /** With an href it is the "Create new character" call to action; without, a quiet empty view. */
  href?: string;
};

/** The dashed card in an empty carousel (design 01.1, 01.6; quiet in 01.5). */
export default function EmptyCharacterCard({ label, href }: EmptyCharacterCardProps) {
  const outline = (
    <svg className={styles.outline} viewBox="0 0 292 397" aria-hidden="true">
      <rect x="0.5" y="0.5" width="291" height="396" rx="64.5" />
    </svg>
  );

  if (!href) {
    return (
      <div className={`${styles.card} ${styles.quiet}`}>
        {outline}
        <p className={styles.label}>{label}</p>
      </div>
    );
  }

  return (
    <Link href={href} className={styles.card}>
      {outline}
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.content}>
        <Icon name="addCircle" size={32} />
        <span className={styles.label}>{label}</span>
      </span>
    </Link>
  );
}
