import styles from "./SheetSkeleton.module.css";

/**
 * The sheet while it loads (Figma "Sheet skeleton" 2425:37446, Panel=Down; page 8 F5 A, the pick):
 * skeleton art with slice 1's shimmer, the identity band and three lines, no text. At wide (FW2) the art
 * holds the left 480 and the content column shows the strip, the tabs and a row of blocks. A status
 * region says what is loading.
 */
export default function SheetSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? `${styles.skeleton} ${styles.wide}` : styles.skeleton} role="status" aria-busy="true">
      <span className={styles.hidden}>Loading the character sheet</span>
      <div className={styles.art} aria-hidden="true">
        <div className={styles.shimmer} />
        <div className={styles.band}>
          <span className={`${styles.line} ${styles.eyebrow}`} />
          <span className={`${styles.line} ${styles.name}`} />
          <span className={`${styles.line} ${styles.subtitle}`} />
        </div>
      </div>
      {wide && (
        <div className={styles.content} aria-hidden="true">
          <span className={styles.strip} />
          <span className={styles.tabs} />
          <div className={styles.row}>
            <span className={styles.block} />
            <span className={styles.block} />
            <span className={styles.block} />
          </div>
        </div>
      )}
    </div>
  );
}
