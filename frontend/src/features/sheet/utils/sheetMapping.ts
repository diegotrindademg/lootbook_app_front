import { BLOCK_TYPE_LABEL } from "../data/blockPresets";
import type {
  CharacterSheet,
  ChoiceOption,
  DerivedLink,
  DerivedValueDecl,
  DocBlock,
  ListRow,
  NoteRow,
  ResetRule,
  ResourceRow,
  SheetBlock,
  SheetDraft,
  SheetPayload,
  StatRow,
  StoredSheet,
} from "../types";
import { identityFromBlocks } from "./blocks";
import { mintId, slugKey, uniqueKey } from "./ids";

/** Trims and cuts a label to the document's rule: 1 to `max` characters, no space at either end. */
function label(value: string, fallback: string, max = 80) {
  const trimmed = value.trim().slice(0, max).trim();
  return trimmed || fallback;
}

function optional(value: string | undefined, max: number) {
  const trimmed = (value ?? "").trim().slice(0, max);
  return trimmed ? trimmed : undefined;
}

function cleanReset(reset: ResetRule): ResetRule {
  if (reset.mode !== "label") return reset;
  const text = reset.label.trim().slice(0, 80).trim();
  return text ? { mode: "label", label: text } : { mode: "manual" };
}

function cleanOption(option: ChoiceOption): ChoiceOption {
  const clean: ChoiceOption = { id: option.id, name: label(option.name, "Option") };
  const description = optional(option.description, 2000);
  const art = optional(option.art, 2048);
  const grants = optional(option.grants, 500);
  if (description) clean.description = description;
  if (art) clean.art = art;
  if (grants) clean.grants = grants;
  return clean;
}

function cleanRow(row: ListRow): ListRow {
  const clean: ListRow = { id: row.id, name: row.name.trim().slice(0, 160) || "Item" };
  const value = optional(row.value, 40);
  const attribute = optional(row.attribute, 120);
  const note = optional(row.note, 500);
  if (value) clean.value = value;
  if (attribute) clean.attribute = attribute;
  if (row.trained !== undefined) clean.trained = row.trained;
  if (note) clean.note = note;
  if (row.icon) clean.icon = row.icon;
  return clean;
}

/** "MIGHT" -> "MIG"; the design's rule for a new value's abbreviation. */
export function abbreviate(name: string) {
  return name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3).toUpperCase();
}

/**
 * Gives every stat entry, derived value and resource its key (once, never changed after), and
 * cleans what the user typed so the document passes sheet-document.md 2.6. Returns the blocks with
 * their keys, which the editor keeps.
 */
export function assignKeys(blocks: SheetBlock[]): SheetBlock[] {
  const statKeys = new Set<string>();
  const resourceKeys = new Set<string>();
  for (const block of blocks) {
    if (block.type === "stats") {
      for (const entry of block.entries) {
        if (entry.key) statKeys.add(entry.key);
        if (entry.derived?.key) statKeys.add(entry.derived.key);
      }
    }
    if (block.type === "resource") block.tiers.forEach((tier) => tier.key && resourceKeys.add(tier.key));
  }

  return blocks.map((block) => {
    if (block.type === "stats") {
      return {
        ...block,
        entries: block.entries.map((entry) => {
          const key = entry.key ?? uniqueKey(slugKey(entry.name, "value"), statKeys);
          const derived = entry.derived && {
            ...entry.derived,
            key: entry.derived.key ?? uniqueKey(`${key}_mod`, statKeys),
          };
          return { ...entry, key, derived };
        }),
      };
    }
    if (block.type === "resource") {
      return {
        ...block,
        tiers: block.tiers.map((tier) => ({
          ...tier,
          key:
            tier.key ??
            uniqueKey(
              slugKey(block.model === "tiered" ? `${block.title} ${tier.label}` : block.title, "resource"),
              resourceKeys,
            ),
        })),
      };
    }
    return block;
  });
}

/**
 * The screen's blocks as one save: the document (arrangement), the rows for the existing tables
 * (numbers and words), the links that produce derived values, and the card line.
 * Call `assignKeys` first; entries without a key are skipped.
 */
export function toPayload(blocks: SheetBlock[]): SheetPayload {
  const stats: StatRow[] = [];
  const resources: ResourceRow[] = [];
  const notes: NoteRow[] = [];
  const links: DerivedLink[] = [];

  const docBlocks = blocks.map((block): DocBlock => {
    const base = {
      id: block.id,
      title: label(block.title, BLOCK_TYPE_LABEL[block.type]),
      icon: block.icon,
      pinned: block.pinned,
      density: block.density,
      preset: block.preset ? block.preset.slice(0, 40) : null,
    };

    switch (block.type) {
      case "choice": {
        const options = block.mode === "text" ? [] : block.options.map(cleanOption);
        const ids = new Set(options.map((option) => option.id));
        let value: string | string[] | null;
        if (block.mode === "text") {
          const text = typeof block.value === "string" ? block.value.slice(0, 2000) : "";
          value = text.trim() ? text : null;
        } else if (block.mode === "many") {
          value = (Array.isArray(block.value) ? block.value : []).filter((id) => ids.has(id));
        } else {
          value = typeof block.value === "string" && ids.has(block.value) ? block.value : null;
        }
        return { ...base, type: "choice", mode: block.mode, options, value };
      }

      case "stats": {
        const entries = block.entries.filter((entry) => entry.key);
        const derived: DerivedValueDecl[] = [];
        for (const entry of entries) {
          const name = label(entry.name, entry.abbr.trim() || "Value", 120);
          stats.push({ key: entry.key!, label: name, baseValue: entry.value, currentValue: entry.value, maxValue: null });
          if (entry.derived?.key) {
            derived.push({
              key: entry.derived.key,
              label: label(entry.derived.label, `${name} modifier`),
              order: Math.max(0, Math.min(999, Math.round(entry.derived.order))),
              entryKey: entry.key,
              signed: entry.derived.signed,
            });
            links.push({
              sourceKey: entry.key!,
              targetKey: entry.derived.key,
              multiplier: entry.derived.multiplier,
              offset: entry.derived.offset,
              rounding: entry.derived.rounding,
            });
          }
        }
        return {
          ...base,
          type: "stats",
          fill: block.fill,
          fillConfig: block.fillConfig,
          entries: entries.map((entry) => ({
            key: entry.key!,
            abbr: (entry.abbr.trim() || abbreviate(entry.name) || "VAL").slice(0, 6),
          })),
          derived,
        };
      }

      case "resource": {
        const tiers = block.model === "tiered" ? block.tiers : block.tiers.slice(0, 1);
        for (const tier of tiers) {
          if (!tier.key) continue;
          resources.push({
            key: tier.key,
            label: label(block.model === "tiered" ? tier.label : base.title, "Tier", 120),
            currentValue: Math.max(0, Math.min(tier.current, tier.max)),
            maxValue: tier.max,
            resetRule: null,
          });
        }
        return {
          ...base,
          type: "resource",
          model: block.model,
          resourceKeys: tiers.map((tier) => tier.key).filter((key): key is string => Boolean(key)),
          reset: cleanReset(block.reset),
        };
      }

      case "list":
        return {
          ...base,
          type: "list",
          showIcons: block.showIcons,
          rows: block.rows.map((row) => {
            const clean = cleanRow(row);
            if (block.trainable) clean.trained = Boolean(row.trained);
            else delete clean.trained;
            if (!block.showIcons) delete clean.icon;
            return clean;
          }),
        };

      case "text":
        if (block.body.trim()) notes.push({ section: block.id, content: block.body.slice(0, 50000) });
        return { ...base, type: "text", collapsed: block.collapsed };
    }
  });

  const subtitle = identityFromBlocks(blocks).cardSubtitle.slice(0, 160);
  return {
    document: { schemaVersion: 1, blocks: docBlocks },
    stats,
    resources,
    notes,
    links,
    summaryJson: { card: { subtitle: subtitle || null } },
  };
}

/** A stored sheet back into the screen's blocks. A key with no row shows its key until the row arrives. */
export function fromStored(stored: StoredSheet): CharacterSheet {
  const statByKey = new Map(stored.stats.map((row) => [row.key, row]));
  const resourceByKey = new Map(stored.resources.map((row) => [row.key, row]));
  const noteBySection = new Map(stored.notes.map((row) => [row.section, row]));
  const linkByTarget = new Map(stored.links.map((link) => [link.targetKey, link]));
  const valueByKey = new Map(stored.derivedValues.map((value) => [value.key, value.value]));

  const blocks = (stored.document?.blocks ?? []).map((block): SheetBlock => {
    const base = {
      id: block.id,
      title: block.title,
      icon: block.icon,
      pinned: block.pinned,
      density: block.density,
      preset: block.preset,
    };
    switch (block.type) {
      case "choice":
        return {
          ...base,
          type: "choice",
          mode: block.mode,
          options: block.options,
          value: block.mode === "text" ? (block.value ?? "") : block.value,
        };
      case "stats":
        return {
          ...base,
          type: "stats",
          fill: block.fill,
          fillConfig: block.fillConfig,
          entries: block.entries.map((entry) => {
            const row = statByKey.get(entry.key);
            const decl = block.derived.find((d) => d.entryKey === entry.key);
            const link = decl ? linkByTarget.get(decl.key) : undefined;
            return {
              key: entry.key,
              localId: entry.key,
              name: row?.label ?? entry.key,
              abbr: entry.abbr,
              value: row?.currentValue ?? row?.baseValue ?? null,
              derived: decl
                ? {
                    key: decl.key,
                    label: decl.label,
                    order: decl.order,
                    signed: decl.signed,
                    multiplier: link?.multiplier ?? 1,
                    offset: link?.offset ?? 0,
                    rounding: link?.rounding ?? "none",
                    value: valueByKey.get(decl.key) ?? null,
                  }
                : null,
            };
          }),
        };
      case "resource":
        return {
          ...base,
          type: "resource",
          model: block.model,
          reset: block.reset,
          tiers: block.resourceKeys.map((key) => {
            const row = resourceByKey.get(key);
            return {
              key,
              localId: key,
              label: row?.label ?? key,
              current: row?.currentValue ?? 0,
              max: row?.maxValue ?? 0,
            };
          }),
        };
      case "list":
        return {
          ...base,
          type: "list",
          showIcons: block.showIcons,
          trainable: block.rows.some((row) => row.trained !== undefined),
          rows: block.rows,
        };
      case "text":
        return { ...base, type: "text", collapsed: block.collapsed, body: noteBySection.get(block.id)?.content ?? "" };
    }
  });

  return {
    id: stored.character.id,
    name: stored.character.name,
    imageUrl: stored.character.imageUrl,
    favorite: stored.character.favorite,
    revision: stored.revision,
    blocks,
  };
}

/** A copy of a sheet's blocks for the editor, with fresh local ids where a row has none. */
export function draftFromSheet(sheet: CharacterSheet): SheetDraft {
  return {
    name: sheet.name,
    blocks: sheet.blocks.map((block) => {
      if (block.type === "stats") {
        return { ...block, entries: block.entries.map((entry) => ({ ...entry, localId: entry.localId || mintId("e") })) };
      }
      return block;
    }),
  };
}
