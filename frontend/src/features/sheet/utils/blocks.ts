import type { BlockPreset } from "../data/blockPresets";
import { DEFAULT_POOL } from "./fillMethods";
import type { BlockDensity, BlockType, ResetRule, SheetBlock } from "../types";
import { mintId } from "./ids";

const MODE_LABEL = { one: "Pick one", many: "Pick several", text: "Free text" } as const;
const FILL_LABEL = { free: "Free entry", pool: "Point pool", array: "Array", roll: "Rolled" } as const;
const MODEL_LABEL = { counter: "Counter", pips: "Pip row", tiered: "Tiered slots", gauge: "Gauge" } as const;

/** Contract section 3: Stat set and Resource start half width, the rest full. Phone ignores it. */
export function defaultDensity(type: BlockType): BlockDensity {
  return type === "stats" || type === "resource" ? "half" : "full";
}

/** A new, empty block from a library preset (design `blockFromPreset`). */
export function blockFromPreset(preset: BlockPreset): SheetBlock {
  const base = {
    id: mintId("b"),
    title: preset.title,
    icon: preset.icon,
    pinned: false,
    density: defaultDensity(preset.type),
    preset: preset.key,
  };
  switch (preset.type) {
    case "choice": {
      const mode = preset.mode ?? "one";
      return { ...base, type: "choice", mode, options: [], value: mode === "text" ? "" : mode === "many" ? [] : null };
    }
    case "stats":
      // A point pool starts with its rules stored, so the sheet keeps them (sheet-document.md 2.4).
      return {
        ...base,
        type: "stats",
        fill: preset.fill ?? "free",
        fillConfig: preset.fill === "pool" ? { ...DEFAULT_POOL } : null,
        entries: [],
      };
    case "resource": {
      const model = preset.model ?? "counter";
      return {
        ...base,
        type: "resource",
        model,
        reset: preset.reset ?? { mode: "manual" },
        tiers:
          model === "tiered"
            ? [{ key: null, localId: mintId("t"), label: "Tier 1", current: 0, max: 2 }]
            : [{ key: null, localId: mintId("t"), label: preset.title, current: 0, max: 10 }],
      };
    }
    case "list":
      return { ...base, type: "list", showIcons: Boolean(preset.showIcons), rows: [] };
    case "text":
      return { ...base, type: "text", collapsed: false, body: "" };
  }
}

/** The sheet's line under a resource: "Resets manually", "Resets each session", "Resets on <label>". */
export function resetNote(reset: ResetRule) {
  if (reset.mode === "manual") return "Resets manually";
  if (reset.mode === "session") return "Resets each session";
  return `Resets on ${reset.label}`;
}

/** The one line under a block's title in the editor (design `blockSummary`). */
export function blockSummary(block: SheetBlock) {
  switch (block.type) {
    case "choice": {
      if (block.mode === "text") return MODE_LABEL.text;
      const n = block.options.length;
      return `${MODE_LABEL[block.mode]} · ${n} option${n === 1 ? "" : "s"}`;
    }
    case "stats":
      return `${block.entries.length} value${block.entries.length === 1 ? "" : "s"} · ${FILL_LABEL[block.fill]}`;
    case "resource": {
      const reset =
        block.reset.mode === "manual"
          ? "manual reset"
          : block.reset.mode === "session"
            ? "resets each session"
            : `resets on ${block.reset.label}`;
      return `${MODEL_LABEL[block.model]} · ${reset}`;
    }
    case "list":
      return `${block.rows.length} item${block.rows.length === 1 ? "" : "s"}`;
    case "text":
      return block.body.trim() ? "Prose" : "Empty";
  }
}

export const FILL_LABELS = FILL_LABEL;

/** The names of the picked options of a Choice, in pick order. */
export function pickedNames(block: SheetBlock) {
  if (block.type !== "choice" || block.mode === "text") return [];
  const ids = Array.isArray(block.value) ? block.value : block.value ? [block.value] : [];
  return ids
    .map((id) => block.options.find((option) => option.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

/**
 * The three identity lines, built from the character's own blocks (design `identityFromBlocks`):
 * the eyebrow is every picked option, the subtitle the first free-text Choice, else the first line
 * of the first Text block with words, and the card line the picks in their own case, else the subtitle.
 */
export function identityFromBlocks(blocks: SheetBlock[]) {
  const picks: string[] = [];
  let subtitle = "";
  for (const block of blocks) {
    if (block.type !== "choice") continue;
    if (block.mode === "text") {
      if (!subtitle && typeof block.value === "string" && block.value.trim()) {
        subtitle = block.value.split("\n")[0].trim();
      }
    } else {
      picks.push(...pickedNames(block));
    }
  }
  if (!subtitle) {
    const text = blocks.find((block) => block.type === "text" && block.body.trim());
    if (text && text.type === "text") subtitle = text.body.trim().split("\n")[0];
  }
  return {
    eyebrow: picks.join(" · ").toUpperCase(),
    subtitle,
    cardSubtitle: picks.length ? picks.join(" · ") : subtitle,
  };
}

/** Would removing this block lose something the user typed? (design `blockHasContent`) */
export function blockHasContent(block: SheetBlock) {
  switch (block.type) {
    case "choice":
      return (
        block.options.length > 0 ||
        (Array.isArray(block.value) ? block.value.length > 0 : Boolean(block.value && block.value.trim()))
      );
    case "stats":
      return block.entries.length > 0;
    case "resource":
      return block.tiers.some((tier) => tier.current > 0) || block.tiers.length > 1;
    case "list":
      return block.rows.length > 0;
    case "text":
      return Boolean(block.body.trim());
  }
}

/** "sparkles" -> "Sparkles": the spoken name of a block icon. */
export function iconName(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
