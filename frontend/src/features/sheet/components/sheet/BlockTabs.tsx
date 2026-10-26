"use client";

import { useRef } from "react";
import type { SheetBlock } from "../../types";
import styles from "./BlockTabs.module.css";

type BlockTabsProps = {
  blocks: SheetBlock[];
  activeId: string;
  onChange: (id: string) => void;
  panelId?: string;
  /** Wide (Figma "H1 · Brakka · wide"): every block is on the page and a tab scrolls to its section. */
  anchors?: boolean;
};

/**
 * One tab per block (design `BlockTabs`): a pill track that scrolls once there are more than four.
 * A tab list: Tab reaches the chosen tab, the arrow keys move between tabs. As anchors it is a row of
 * links to the sections below, each reached with Tab, the one in view marked current.
 */
export default function BlockTabs({ blocks, activeId, onChange, panelId, anchors = false }: BlockTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrolls = blocks.length > 4;
  const go = (index: number) => {
    const next = (index + blocks.length) % blocks.length;
    onChange(blocks[next].id);
    refs.current[next]?.focus();
    refs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  if (anchors) {
    return (
      <nav aria-label="Blocks">
        <div className={scrolls ? `${styles.track} ${styles.scrolls}` : styles.track}>
          {blocks.map((block) => {
            const active = block.id === activeId;
            return (
              <button
                key={block.id}
                type="button"
                aria-current={active ? "location" : undefined}
                className={active ? `${styles.tab} ${styles.active}` : styles.tab}
                onClick={() => onChange(block.id)}
              >
                <span className={styles.label}>{block.title}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className={scrolls ? `${styles.track} ${styles.scrolls}` : styles.track} role="tablist" aria-label="Blocks">
      {blocks.map((block, index) => {
        const active = block.id === activeId;
        return (
          <button
            key={block.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${block.id}`}
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onChange(block.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                go(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                go(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                go(0);
              } else if (event.key === "End") {
                event.preventDefault();
                go(blocks.length - 1);
              }
            }}
          >
            <span className={styles.label}>{block.title}</span>
          </button>
        );
      })}
    </div>
  );
}
