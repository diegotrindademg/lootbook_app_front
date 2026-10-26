import styles from "./AppColumn.module.css";

type AppColumnProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * "phone" keeps the phone-width column at every width; "page" opens to the wide layout from 1024px
   * (Figma's wide frames, slice 3), up to 1440 wide.
   */
  size?: "phone" | "page";
};

/** The column every screen sits in: phone width, or the whole page at wide widths. */
export default function AppColumn({ children, className, size = "phone" }: AppColumnProps) {
  return (
    <div className={[styles.column, size === "page" && styles.page, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
