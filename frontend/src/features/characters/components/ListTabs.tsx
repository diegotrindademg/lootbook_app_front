import { useRef } from "react";
import type { CharacterListTab } from "../types";
import styles from "./ListTabs.module.css";

export const LIST_TABS: CharacterListTab[] = ["Recent", "Favorites", "Archived"];

type ListTabsProps = {
  active: CharacterListTab;
  onChange: (tab: CharacterListTab) => void;
  /** id of the element the tabs filter. */
  controls: string;
};

/** Recent, Favorites, Archived over the carousel. Arrow keys move between them. */
export default function ListTabs({ active, onChange, controls }: ListTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, step: number) => {
    const next = (from + step + LIST_TABS.length) % LIST_TABS.length;
    onChange(LIST_TABS[next]);
    refs.current[next]?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label="Character lists">
      {LIST_TABS.map((tab, index) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            className={selected ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") move(index, 1);
              if (event.key === "ArrowLeft") move(index, -1);
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
