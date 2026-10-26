import { useRef, type Ref } from "react";
import Icon from "@/shared/components/ui/Icon";
import styles from "./CharacterSearchField.module.css";

type CharacterSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  inputRef: Ref<HTMLInputElement>;
};

/**
 * Search on the character screen; it filters the list tab you are on. The text stays when the list tab
 * changes and goes when the screen does (contract v1.1, 7). The clear button shows once there is text.
 * WAITING ON DESIGN: 7 (the clear button is page 7's variant of the Field set).
 */
export default function CharacterSearchField({
  value,
  onChange,
  onFocusChange,
  inputRef,
}: CharacterSearchFieldProps) {
  const fieldRef = useRef<HTMLLabelElement>(null);
  return (
    <label className={styles.field} ref={fieldRef}>
      <Icon name="search" size={18} className={styles.icon} />
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        placeholder="Search"
        aria-label="Search characters"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            fieldRef.current?.querySelector("input")?.focus();
          }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </label>
  );
}
