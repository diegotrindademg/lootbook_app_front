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

/**
 * Spending and adjusting at the table through the one-value write (one-value-write.md 7): the change
 * shows at once, every tap is an `adjust` by the difference, and the shown value is replaced by the
 * answer to the latest tap. A failed tap is never retried by itself: the sheet is read again and a
 * notice says so. A conflict shows the value the back end holds.
 */
export function useResourcePlay(characterId: string, setSheet: Setter) {
  const [failed, setFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const latest = useRef(new Map<string, number>());

  const setResource = useCallback(
    (block: ResourceBlock, tier: number, next: number) => {
      const target = block.tiers[tier];
      if (!target?.key) return;
      const key = target.key;
      const wanted = Math.max(0, target.max ? Math.min(next, target.max) : next);
      const delta = wanted - target.current;
      if (delta === 0) return;

      setFailed(false);
      setSheet((sheet) => sheet && withTier(sheet, block.id, tier, wanted));
      const sent = (latest.current.get(key) ?? 0) + 1;
      latest.current.set(key, sent);
      const label = block.model === "tiered" ? `${block.title} ${target.label}` : block.title;

      sheetApi
        .changeResource(characterId, key, { adjust: delta })
        .then((result) => {
          if (latest.current.get(key) !== sent) return;
          setSheet((sheet) => sheet && withTier(sheet, block.id, tier, result.current));
          setAnnouncement(
            result.clamped
              ? `${label} is at ${result.current === 0 ? "zero" : "its maximum"}`
              : `${label} ${result.current}${result.max ? ` of ${result.max}` : ""}`,
          );
        })
        .catch(async (error) => {
          if (error instanceof ResourceChangedError) {
            setSheet((sheet) => sheet && withTier(sheet, block.id, tier, error.currentValue));
            return;
          }
          setFailed(true);
          try {
            const fresh = await sheetApi.getSheet(characterId);
            setSheet((sheet) => (sheet ? { ...sheet, blocks: fresh.blocks } : fresh));
          } catch {
            setSheet((sheet) => sheet && withTier(sheet, block.id, tier, target.current));
          }
        });
    },
    [characterId, setSheet],
  );

  /**
   * Sets each tier to a value with the one-value write's `set` and the value last seen
   * (one-value-write.md 7: a reset uses set). Used by New session, a block's Reset link and their Undo.
   */
  const setMany = useCallback(
    (changes: ResourceSet[]) => {
      if (!changes.length) return;
      setFailed(false);
      setSheet((sheet) => changes.reduce((s, c) => (s ? withTier(s, c.blockId, c.tier, c.to) : s), sheet));
      Promise.all(
        changes.map((c) => sheetApi.changeResource(characterId, c.key, { set: c.to, expectedCurrent: c.from })),
      )
        .then((results) =>
          setSheet((sheet) =>
            results.reduce((s, result, i) => (s ? withTier(s, changes[i].blockId, changes[i].tier, result.current) : s), sheet),
          ),
        )
        .catch(async () => {
          setFailed(true);
          try {
            const fresh = await sheetApi.getSheet(characterId);
            setSheet((sheet) => (sheet ? { ...sheet, blocks: fresh.blocks } : fresh));
          } catch {
            setSheet((sheet) => changes.reduce((s, c) => (s ? withTier(s, c.blockId, c.tier, c.from) : s), sheet));
          }
        });
    },
    [characterId, setSheet],
  );

  return { setResource, setMany, failed, dismissFailure: () => setFailed(false), announcement };
}
