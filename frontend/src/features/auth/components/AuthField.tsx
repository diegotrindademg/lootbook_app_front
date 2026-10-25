import styles from "./AuthField.module.css";

type AuthFieldProps = {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid?: boolean;
  disabled?: boolean;
};

/** One sign-in field. The design shows only a placeholder, so the label is the accessible name. */
export default function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  invalid = false,
  disabled = false,
}: AuthFieldProps) {
  return (
    <input
      className={invalid ? `${styles.field} ${styles.invalid}` : styles.field}
      type={type}
      value={value}
      placeholder={label}
      aria-label={label}
      aria-invalid={invalid || undefined}
      autoComplete={autoComplete}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
