"use client";

import { useRef } from "react";
import styles from "./Segmented.module.css";

type SegmentedProps<T extends string> = {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
};

/**
 * A pill track of choices (design `Segmented`). One radio group: Tab reaches the chosen one,
 * the arrow keys move the choice.
 */
export default function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    onChange(options[next][0]);
    refs.current[next]?.focus();
  };

  return (
    <div className={styles.track} role="radiogroup" aria-label={label}>
      {options.map(([key, text], index) => {
        const on = key === value;
        return (
          <button
            key={key}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className={on ? `${styles.segment} ${styles.on}` : styles.segment}
            onClick={() => onChange(key)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                move(index, -1);
              }
            }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
