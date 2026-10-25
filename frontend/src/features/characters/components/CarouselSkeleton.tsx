import styles from "./CarouselSkeleton.module.css";

/** The card-shaped placeholder shown in the carousel while the list loads (design 01.0). */
export default function CarouselSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.infoBar} />
      <div className={styles.shimmer} />
    </div>
  );
}
