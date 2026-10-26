"use client";

import { useCallback, useRef, useState } from "react";
import { ResourceChangedError, sheetApi } from "../api/sheetApi";
import type { CharacterSheet, ResourceBlock } from "../types";

type Setter = React.Dispatch<React.SetStateAction<CharacterSheet | null>>;

/** One tier set from one value to another, for New session, Reset and Undo. */
export type ResourceSet = { blockId: string; tier: number; key: string; from: number; to: number };

/** The tiers of these blocks that are not full, each to be set to its maximum. */
export function refills(blocks: ResourceBlock[]): ResourceSet[] {
  return blocks.flatMap((block) =>
    block.tiers.flatMap((tier, index) =>
      tier.key && tier.max > 0 && tier.current < tier.max
        ? [{ blockId: block.id, tier: index, key: tier.key, from: tier.current, to: tier.max }]
        : [],
    ),
  );
}

/** "Health", "Health and Grit dice", "Health, Mana and Grit dice". */
export function listTitles(titles: string[]) {
  if (titles.length < 2) return titles.join("");
  return `${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}`;
}

function withTier(sheet: CharacterSheet, blockId: string, tier: number, current: number): CharacterSheet {
  return {
    ...sheet,
    blocks: sheet.blocks.map((block) =>
      block.id === blockId && block.type === "resource"
        ? { ...block, tiers: block.tiers.map((t, i) => (i === tier ? { ...t, current } : t)) }
        : block,
    ),
  };
}

/** A change at the table that did not save: what the sheet went back to, and the same change again. */
export type PlayFailure = { message: string; retry: () => void };

/**
 * Spending and adjusting at the table through the one-value write (one-value-write.md 7): the change
 * shows at once, every tap is an `adjust` by the difference, and the shown value is replaced by the
 * answer to the latest tap. A conflict shows the value the back end holds. A tap that fails is never
 * retried by itself (contract 3 and v1.1, 5): the value goes back to the last saved one, a notice says
 * so, and its Retry sends the same change again from that saved value.
 */
export function useResourcePlay(characterId: string, setSheet: Setter) {
  const [failure, setFailure] = useState<PlayFailure | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const latest = useRef(new Map<string, number>());
  /** Per resource key, the value the back end last confirmed, while a change is on its way. */
  const saved = useRef(new Map<string, number>());

  const send = useCallback(
    (blockId: string, tier: number, key: string, label: string, from: number, to: number) => {
      setFailure(null);
      setSheet((sheet) => sheet && withTier(sheet, blockId, tier, to));
      const sent = (latest.current.get(key) ?? 0) + 1;
      latest.current.set(key, sent);

      sheetApi
        .changeResource(characterId, key, { adjust: to - from })
        .then((result) => {
          if (latest.current.get(key) !== sent) {
            saved.current.set(key, result.current);
            return;
          }
          saved.current.delete(key);
          setSheet((sheet) => sheet && withTier(sheet, blockId, tier, result.current));
          setAnnouncement(
            result.clamped
              ? `${label} is at ${result.current === 0 ? "zero" : "its maximum"}`
              : `${label} ${result.current}${result.max ? ` of ${result.max}` : ""}`,
          );
        })
        .catch((error) => {
          if (latest.current.get(key) !== sent) return;
          const last = saved.current.get(key) ?? from;
          saved.current.delete(key);
          if (error instanceof ResourceChangedError) {
            setSheet((sheet) => sheet && withTier(sheet, blockId, tier, error.currentValue));
            return;
          }
          setSheet((sheet) => sheet && withTier(sheet, blockId, tier, last));
          setAnnouncement(`${label} did not save, back to ${last}`);
          setFailure({
            message: `${label} is back at ${last}, the last saved value.`,
            retry: () => {
              saved.current.set(key, last);
              send(blockId, tier, key, label, last, to);
            },
          });
        });
    },
    [characterId, setSheet],
  );

  const setResource = useCallback(
    (block: ResourceBlock, tier: number, next: number) => {
      const target = block.tiers[tier];
      if (!target?.key) return;
      const wanted = Math.max(0, target.max ? Math.min(next, target.max) : next);
      if (wanted === target.current) return;
      // With nothing on its way, the value on screen is the saved one.
      if (!saved.current.has(target.key)) saved.current.set(target.key, target.current);
      const label = block.model === "tiered" ? `${block.title} ${target.label}` : block.title;
      send(block.id, tier, target.key, label, target.current, wanted);
    },
    [send],
  );

  /**
   * Sets each tier to a value with the one-value write's `set` and the value last seen
   * (one-value-write.md 7: a reset uses set). Used by New session, a block's Reset link and their Undo.
   * A tier that fails goes back to its last saved value, and Retry sets the failed ones again.
   */
  const setMany = useCallback(
    (changes: ResourceSet[]) => {
      if (!changes.length) return;
      setFailure(null);
      setSheet((sheet) => changes.reduce((s, c) => (s ? withTier(s, c.blockId, c.tier, c.to) : s), sheet));
      Promise.allSettled(
        changes.map((c) => sheetApi.changeResource(characterId, c.key, { set: c.to, expectedCurrent: c.from })),
      ).then(async (results) => {
        const conflict = results.some((r) => r.status === "rejected" && r.reason instanceof ResourceChangedError);
        if (conflict) {
          // Another device moved a value: show what the back end holds now.
          try {
            const fresh = await sheetApi.getSheet(characterId);
            setSheet((sheet) => (sheet ? { ...sheet, blocks: fresh.blocks } : fresh));
            return;
          } catch {
            // Offline as well: each failed tier goes back to its value before.
          }
        }
        // Each tier that saved keeps its answer; each that failed goes back to its value before.
        setSheet((sheet) =>
          results.reduce((s, r, i) => {
            const c = changes[i];
            return s ? withTier(s, c.blockId, c.tier, r.status === "fulfilled" ? r.value.current : c.from) : s;
          }, sheet),
        );
        const unsaved = changes.filter((_, i) => results[i].status === "rejected");
        if (!unsaved.length) return;
        setAnnouncement("The change did not save, back to the last saved values");
        setFailure({
          message: "Back to the last saved values.",
          retry: () => setMany(unsaved),
        });
      });
    },
    [characterId, setSheet],
  );

  return { setResource, setMany, failure, dismissFailure: () => setFailure(null), announcement };
}
