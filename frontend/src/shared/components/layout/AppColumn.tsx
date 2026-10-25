import styles from "./AppColumn.module.css";

type AppColumnProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * The phone-width column every new screen sits in.
 * WAITING ON THE WIDE DESIGN: at wide widths the column is centred until the wide layout is drawn
 * (plan M5, one wide layout for every screen); replace this rule then.
 */
export default function AppColumn({ children, className }: AppColumnProps) {
  return <div className={[styles.column, className].filter(Boolean).join(" ")}>{children}</div>;
}
