import Image from "next/image";
import styles from "./SplashScreen.module.css";

/**
 * Launch screen (design S1): the tavern plate, which carries the goblin mark and wordmark, under an
 * edge vignette. It advances on its own; a tap skips it.
 */
export default function SplashScreen({ onSkip }: { onSkip: () => void }) {
  return (
    <div className={styles.splash} onClick={onSkip}>
      <Image
        className={styles.plate}
        src="/images/splash-background.png"
        alt="Lootbook"
        fill
        priority
        sizes="(max-width: 430px) 100vw, 430px"
      />
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
}
