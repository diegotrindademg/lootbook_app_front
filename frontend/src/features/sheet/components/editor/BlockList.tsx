"use client";

import { useEffect, useRef, useState } from "react";
import type { SheetBlock } from "../../types";
import BlockRow from "./BlockRow";
import styles from "./BlockList.module.css";

const ROW_HEIGHT = 72;
const ROW_GAP = 12;
const PITCH = ROW_HEIGHT + ROW_GAP;

type BlockListProps = {
  blocks: SheetBlock[];
  onConfigure: (block: SheetBlock) => void;
  onTogglePin: (block: SheetBlock) => void;
  onMove: (from: number, to: number) => void;
  emptyHint: string;
};

/**
 * The editor's ordered blocks (design `BlockList`). Drag the grip: rows are stacked at a pitch of
 * 84, the dragged row follows the pointer and the rows between shift by one place in 180ms; on
 * release the block moves. By keyboard, the grip is a button and the up and down arrows move the
 * block one place; a status line says where it went.
 */
export default function BlockList({ blocks, onConfigure, onTogglePin, onMove, emptyHint }: BlockListProps) {
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const startY = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);
  // Moving a row moves its element in the page, which can drop focus; put it back on the grip.
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    if (!refocus.current) return;
    listRef.current?.querySelector<HTMLElement>(`[data-grip="${refocus.current}"]`)?.focus();
    refocus.current = null;
  });
  const count = blocks.length;
  const target = drag ? Math.max(0, Math.min(count - 1, drag.from + Math.round(drag.dy / PITCH))) : -1;

  const moveByKey = (index: number, step: number) => {
    const to = index + step;
    if (to < 0 || to >= count) return;
    refocus.current = blocks[index].id;
    onMove(index, to);
    setAnnouncement(`${blocks[index].title} moved to ${to + 1} of ${count}`);
  };

  const endDrag = () => {
    if (!drag) return;
    if (target !== drag.from) {
      onMove(drag.from, target);
      setAnnouncement(`${blocks[drag.from].title} moved to ${target + 1} of ${count}`);
    }
    setDrag(null);
  };

  if (count === 0) return <p className={styles.empty}>{emptyHint}</p>;

  return (
    <>
      <ol
        ref={listRef}
        className={styles.list}
        style={{ height: count * PITCH - ROW_GAP }}
        onPointerMove={(event) => drag && setDrag({ ...drag, dy: event.clientY - startY.current })}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {blocks.map((block, index) => {
          let y = index * PITCH;
          let dragging = false;
          if (drag) {
            if (index === drag.from) {
              y += drag.dy;
              dragging = true;
            } else if (drag.from < target && index > drag.from && index <= target) {
              y -= PITCH;
            } else if (drag.from > target && index < drag.from && index >= target) {
              y += PITCH;
            }
          }
          return (
            <li
              key={block.id}
              className={dragging ? `${styles.item} ${styles.lifted}` : styles.item}
              style={{ transform: `translateY(${y}px)` }}
            >
              <BlockRow
                block={block}
                position={index + 1}
                count={count}
                dragging={dragging}
                onConfigure={() => onConfigure(block)}
                onTogglePin={() => onTogglePin(block)}
                gripProps={{
                  "data-grip": block.id,
                  onPointerDown: (event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    startY.current = event.clientY;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDrag({ from: index, dy: 0 });
                  },
                  onKeyDown: (event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveByKey(index, -1);
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveByKey(index, 1);
                    }
                  },
                }}
              />
            </li>
          );
        })}
      </ol>
      <p id="block-move-help" className={styles.hidden}>
        Drag, or press the up or down arrow, to move this block.
      </p>
      <p className={styles.hidden} role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
