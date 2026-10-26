"use client";

import { useCallback, useRef, useState } from "react";
import { isOnline } from "@/shared/hooks/useOnline";
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

/** A change at the table that did not save (page 8, P3, P3b, P6): the notice, and the same change again. */
export type PlayFailure = { title: string; body: string; retry: () => void };
/** Retry on its way (page 8, P4): an Info notice until it lands. */
export type PlaySaving = { title: string; body?: string };

/**
 * Spending and adjusting at the table through the one-value write (one-value-write.md 7): the change
 * shows at once, every tap is an `adjust` by the difference, and the shown value is replaced by the
 * answer to the latest tap. A conflict shows the value the back end holds. A tap that fails is never
 * retried by itself (contract 3 and v1.1, 5; page 8, P1 to P5): the value goes back to the last saved
 * one, "Health not saved" says so, and Retry sends the same change again from that value while "Saving
 * Health" shows; success removes the notice.
 */
export function useResourcePlay(characterId: string, setSheet: Setter) {
  const [failure, setFailure] = useState<PlayFailure | null>(null);
  const [saving, setSaving] = useState<PlaySaving | null>(null);
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
          setSaving(null);
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
          setSaving(null);
          if (error instanceof ResourceChangedError) {
            setSheet((sheet) => sheet && withTier(sheet, blockId, tier, error.currentValue));
            return;
          }
          setSheet((sheet) => sheet && withTier(sheet, blockId, tier, last));
          setFailure({
            title: `${label} not saved`,
            body: isOnline() ? `Back to ${last}. Check your connection, then Retry.` : `Back to ${last}. You are offline.`,
            retry: () => {
              saved.current.set(key, last);
              setSaving({ title: `Saving ${label}`, body: `Sending ${last} to ${to} again.` });
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
      setSaving(null);
      const label = block.model === "tiered" ? `${block.title} ${target.label}` : block.title;
      send(block.id, tier, target.key, label, target.current, wanted);
    },
    [send],
  );

  /**
   * Sets each tier to a value with the one-value write's `set` and the value last seen
   * (one-value-write.md 7: a reset uses set). Used by New session, a block's Reset link and their Undo,
   * named by `label`. If any tier fails, every tier goes back as it was (page 8, P6: one notice), the
   * ones that saved are set back too, and Retry sends them all again.
   */
  const setMany = useCallback(
    (changes: ResourceSet[], label: string) => {
      if (!changes.length) return;
      setFailure(null);
      setSheet((sheet) => changes.reduce((s, c) => (s ? withTier(s, c.blockId, c.tier, c.to) : s), sheet));
      Promise.allSettled(
        changes.map((c) => sheetApi.changeResource(characterId, c.key, { set: c.to, expectedCurrent: c.from })),
      ).then(async (results) => {
        setSaving(null);
        const conflict = results.some((r) => r.status === "rejected" && r.reason instanceof ResourceChangedError);
        if (conflict) {
          // Another device moved a value: show what the back end holds now.
          try {
            const fresh = await sheetApi.getSheet(characterId);
            setSheet((sheet) => (sheet ? { ...sheet, blocks: fresh.blocks } : fresh));
            return;
          } catch {
            // Offline as well: back as it was, below.
          }
        }
        if (results.every((r) => r.status === "fulfilled")) {
          setSheet((sheet) =>
            results.reduce(
              (s, r, i) => (s && r.status === "fulfilled" ? withTier(s, changes[i].blockId, changes[i].tier, r.value.current) : s),
              sheet,
            ),
          );
          return;
        }
        results.forEach((r, i) => {
          if (r.status !== "fulfilled") return;
          const c = changes[i];
          sheetApi.changeResource(characterId, c.key, { set: c.from, expectedCurrent: r.value.current }).catch(() => undefined);
        });
        setSheet((sheet) => changes.reduce((s, c) => (s ? withTier(s, c.blockId, c.tier, c.from) : s), sheet));
        setFailure({
          title: `${label} not saved`,
          body:
            label === "New session"
              ? "Every resource is back as it was. Retry refills them again."
              : "Back as it was. Retry sends it again.",
          retry: () => {
            setSaving({ title: `Saving ${label}` });
            setMany(changes, label);
          },
        });
      });
    },
    [characterId, setSheet],
  );

  return { setResource, setMany, failure, saving, dismissFailure: () => setFailure(null), announcement };
}
