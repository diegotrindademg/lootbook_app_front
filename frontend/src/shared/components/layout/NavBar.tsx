import Image from "next/image";
import Link from "next/link";
import LootbookLogo from "@/assets/lootbook-logo-horizontal.svg";
import styles from "./NavBar.module.css";

type NavBarProps = {
  /** null while the sign-in check is still running: the right side stays empty. */
  signedIn: boolean | null;
  profileName?: string;
  profileAvatar?: string | null;
  signInHref: string;
  profileHref: string;
};

/** Top bar of the character screen: logo, then Sign in or the profile badge (design S8). */
export default function NavBar({
  signedIn,
  profileName,
  profileAvatar,
  signInHref,
  profileHref,
}: NavBarProps) {
  return (
    <header className={styles.navBar}>
      <LootbookLogo className={styles.logo} role="img" aria-label="Lootbook" />

      {signedIn === true && (
        <Link href={profileHref} className={styles.profile}>
          <span className={styles.profileText}>
            <span className={styles.profileLabel}>Profile</span>
            <span className={styles.profileName}>{profileName}</span>
          </span>
          <span className={styles.avatarRing}>
            {profileAvatar ? (
              <Image className={styles.avatar} src={profileAvatar} alt="" width={36} height={36} />
            ) : (
              <span className={styles.avatar} />
            )}
          </span>
        </Link>
      )}

      {signedIn === false && (
        <Link href={signInHref} className={styles.signIn}>
          Sign in
        </Link>
      )}
    </header>
  );
}
