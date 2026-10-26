import Image from "next/image";
import Link from "next/link";
import Icon from "@/shared/components/ui/Icon";
import styles from "./CharacterCard.module.css";

type CharacterCardProps = {
  name: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** The centred card: full size, info bar and buttons showing. */
  active: boolean;
  /** Where a tap goes. Without it the card does not open (the sample card). */
  href?: string;
  /** Opens the card menu. */
  onMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** A small label in the top left corner, for the sample card. */
  badge?: string;
};

/** A character in the carousel (design 01.2): art, glass info bar with name and identity line. */
export default function CharacterCard({
  name,
  subtitle,
  imageUrl,
  active,
  href,
  onMenu,
  badge,
}: CharacterCardProps) {
  const face = (
    <>
      <span className={styles.frame}>
        {imageUrl && (
          <Image className={styles.art} src={imageUrl} alt="" fill sizes="292px" />
        )}
      </span>
      <span className={styles.infoBar} aria-hidden="true" />
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {href && (
        <span className={styles.open} aria-hidden="true">
          <Icon name="arrowRight" size={24} />
        </span>
      )}
    </>
  );

  return (
    <article
      className={active ? `${styles.card} ${styles.active}` : styles.card}
      aria-label={badge ? `${name}, ${badge.toLowerCase()} character` : name}
    >
      {imageUrl && (
        <Image className={styles.glow} src={imageUrl} alt="" width={295} height={425} aria-hidden="true" />
      )}
      {href ? (
        <Link href={href} className={styles.face} aria-label={`Open ${name}`}>
          {face}
        </Link>
      ) : (
        <div className={styles.face}>{face}</div>
      )}
      {badge && <span className={styles.badge}>{badge}</span>}
      {onMenu && (
        <button
          type="button"
          className={styles.menu}
          aria-label={`More actions for ${name}`}
          aria-haspopup="menu"
          tabIndex={active ? 0 : -1}
          onClick={onMenu}
        >
          <Icon name="more" size={20} strokeWidth={3} />
        </button>
      )}
    </article>
  );
}
