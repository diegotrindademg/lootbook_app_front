import type { Ref } from "react";
import Icon from "@/shared/components/ui/Icon";
import styles from "./CharacterSearchField.module.css";

type CharacterSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  inputRef: Ref<HTMLInputElement>;
};

/** Search on the character screen; it filters the list tab you are on. */
export default function CharacterSearchField({
  value,
  onChange,
  onFocusChange,
  inputRef,
}: CharacterSearchFieldProps) {
  return (
    <label className={styles.field}>
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
    </label>
  );
}
