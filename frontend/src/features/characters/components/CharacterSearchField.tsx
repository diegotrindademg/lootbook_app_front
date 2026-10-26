import { useRef, useState, type Ref } from "react";
import Icon from "@/shared/components/ui/Icon";
import styles from "./CharacterSearchField.module.css";

type CharacterSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  inputRef: Ref<HTMLInputElement>;
};

/**
 * Search on the character screen; it filters the list tab you are on by name and subtitle. The text
 * stays when the list tab changes or the keyboard goes down, and goes when the screen does (contract
 * v1.1, 7; page 7, Flow 15). The clear button (Field "Type=Search, State=Typing" 2425:36385) shows only
 * while the field has focus and text; unfocused, the text stays without it.
 */
export default function CharacterSearchField({
  value,
  onChange,
  onFocusChange,
  inputRef,
}: CharacterSearchFieldProps) {
  const fieldRef = useRef<HTMLLabelElement>(null);
  const [focused, setFocused] = useState(false);
  return (
    <label
      className={styles.field}
      ref={fieldRef}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
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
      {value && focused && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          // A press keeps the focus in the field, so the button does not go before its click lands.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange("");
            fieldRef.current?.querySelector("input")?.focus();
          }}
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </label>
  );
}
