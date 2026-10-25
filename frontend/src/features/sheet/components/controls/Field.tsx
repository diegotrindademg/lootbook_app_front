import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./Field.module.css";

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  size?: "md" | "sm";
  align?: "start" | "center";
};

/** The editor's text field (design `Field`): 44 tall, radius 22; "sm" is the 40 tall values grid field. */
export function Field({ label, size = "md", align = "start", className, ...input }: InputFieldProps) {
  const classes = [styles.field, size === "sm" && styles.small, align === "center" && styles.center, className]
    .filter(Boolean)
    .join(" ");
  return <input aria-label={label} autoComplete="off" {...input} className={classes} />;
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

/** The multi-line field, radius 16. */
export function TextAreaField({ label, className, ...textarea }: TextAreaFieldProps) {
  return (
    <textarea aria-label={label} {...textarea} className={[styles.field, styles.area, className].filter(Boolean).join(" ")} />
  );
}

/** The uppercase label over each section of a sheet (design `SectionLabel`, lifted to 14px). */
export function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p className={styles.sectionLabel} id={id}>
      {children}
    </p>
  );
}
