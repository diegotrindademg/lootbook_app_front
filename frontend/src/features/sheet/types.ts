/**
 * The character's sheet: which blocks it has, in what order, and what each holds.
 *
 * Two shapes live here:
 * - the stored shape, exactly as LootBook `Tasks/Dev/kerley-specs/sheet-document.md` (2.2) defines it:
 *   the arrangement in one document with a revision, the numbers and words in the existing tables by key;
 * - the screen shape the editor and the sheet work with: each block with its content inside it, as the
 *   design's block model draws it. `utils/sheetMapping.ts` turns one into the other.
 */

export const BLOCK_ICON_KEYS = [
  "sword", "shield", "heart", "sparkles", "book", "scroll", "dice", "flame", "star",
  "users", "map", "eye", "bolt", "potion", "backpack", "pen", "target",
] as const;
export type BlockIconKey = (typeof BLOCK_ICON_KEYS)[number];

export type BlockType = "choice" | "stats" | "resource" | "list" | "text";
export type BlockDensity = "half" | "full";
export type ChoiceMode = "one" | "many" | "text";
export type FillMethod = "free" | "pool" | "array" | "roll";
export type ResourceModel = "counter" | "pips" | "tiered" | "gauge";
export type Rounding = "floor" | "ceil" | "round" | "none";

/** M0: Manual, Each session, or a label the user types. */
export type ResetRule = { mode: "manual" } | { mode: "session" } | { mode: "label"; label: string };

// ---- The stored document (sheet-document.md 2.2) ----

type DocBlockBase = {
  id: string;
  title: string;
  icon: BlockIconKey;
  pinned: boolean;
  density: BlockDensity;
  preset: string | null;
};

export type ChoiceOption = {
  id: string;
  name: string;
  description?: string;
  /** An image link. WAITING ON DESIGN: "5 - Blocks" draws "Add art" from the device. */
  art?: string;
  grants?: string;
};

export type DocChoiceBlock = DocBlockBase & {
  type: "choice";
  mode: ChoiceMode;
  options: ChoiceOption[];
  value: string | string[] | null;
};

export type DerivedValueDecl = {
  key: string;
  label: string;
  order: number;
  entryKey: string | null;
  signed: boolean;
};

export type DocStatSetBlock = DocBlockBase & {
  type: "stats";
  fill: FillMethod;
  fillConfig: Record<string, number | string | number[]> | null;
  entries: { key: string; abbr: string }[];
  derived: DerivedValueDecl[];
};

export type DocResourceBlock = DocBlockBase & {
  type: "resource";
  model: ResourceModel;
  resourceKeys: string[];
  reset: ResetRule;
};

export type ListRow = {
  id: string;
  name: string;
  value?: string;
  attribute?: string;
  trained?: boolean;
  note?: string;
  icon?: BlockIconKey;
};

export type DocListBlock = DocBlockBase & { type: "list"; showIcons: boolean; rows: ListRow[] };

export type DocTextBlock = DocBlockBase & { type: "text"; collapsed: boolean };

export type DocBlock = DocChoiceBlock | DocStatSetBlock | DocResourceBlock | DocListBlock | DocTextBlock;

export type SheetDocument = { schemaVersion: 1; blocks: DocBlock[] };

// ---- The existing tables, as the back end returns and replaces them ----

export type StatRow = {
  key: string;
  label: string;
  baseValue: number | null;
  currentValue: number | null;
  maxValue: number | null;
};

export type ResourceRow = {
  key: string;
  label: string;
  currentValue: number | null;
  maxValue: number | null;
  resetRule: string | null;
};

export type NoteRow = { section: string; content: string };

/** A link that produces a derived value (derived-values.md 2.2). */
export type DerivedLink = {
  id?: string;
  sourceKey: string;
  targetKey: string;
  multiplier: number;
  offset: number;
  rounding: Rounding;
};

/** One derived value as `GET /characters/:id/sheet` lists it (derived-values.md 4). */
export type SheetDerivedValue = DerivedValueDecl & { blockId: string; value: number | null };

/** What the sheet read returns, reduced to what the screens use. */
export type StoredSheet = {
  character: {
    id: string;
    name: string;
    imageUrl: string | null;
    favorite: boolean;
  };
  document: SheetDocument | null;
  revision: number;
  stats: StatRow[];
  resources: ResourceRow[];
  notes: NoteRow[];
  links: DerivedLink[];
  derivedValues: SheetDerivedValue[];
};

/** Everything one save writes: the document and the content it points at, replaced together. */
export type SheetPayload = {
  document: SheetDocument;
  stats: StatRow[];
  resources: ResourceRow[];
  notes: NoteRow[];
  links: DerivedLink[];
  summaryJson: { card: { subtitle: string | null } };
};

// ---- The screen shape ----

type BlockBase = DocBlockBase;

export type ChoiceBlock = BlockBase & {
  type: "choice";
  mode: ChoiceMode;
  options: ChoiceOption[];
  /** one: an option id or null; many: option ids; text: the words. */
  value: string | string[] | null;
};

/** The formula behind a derived value: the entry's number times `multiplier`, plus `offset`, rounded. */
export type DerivedEntry = {
  /** Given at the first save, never changed after. */
  key: string | null;
  label: string;
  order: number;
  signed: boolean;
  multiplier: number;
  offset: number;
  rounding: Rounding;
  /** What the back end computed at the last read; the editor recomputes it on the device. */
  value: number | null;
};

export type StatEntry = {
  /** The CharacterStat key: given at the first save, never changed on rename. */
  key: string | null;
  /** Keeps a row stable in the editor before it has a key. */
  localId: string;
  name: string;
  abbr: string;
  value: number | null;
  derived: DerivedEntry | null;
};

export type StatSetBlock = BlockBase & {
  type: "stats";
  fill: FillMethod;
  fillConfig: Record<string, number | string | number[]> | null;
  entries: StatEntry[];
};

export type ResourceTier = {
  /** The CharacterResource key: given at the first save, never changed after. */
  key: string | null;
  localId: string;
  label: string;
  current: number;
  max: number;
};

export type ResourceBlock = BlockBase & {
  type: "resource";
  model: ResourceModel;
  reset: ResetRule;
  /** One entry, holding the block's current and maximum, unless the model is "tiered". */
  tiers: ResourceTier[];
};

/**
 * `trainable` is the list setting "Items can be trained" (Figma page 5, L3 A). The document has no field
 * for it: every row of a trainable list carries `trained`, and a list is read as trainable when a row
 * does, so an empty trainable list comes back off after a save.
 * TODO(Kerley): a list-level `trainable` field in the sheet document; sheet-document.md 2.2 has only `trained` per row.
 */
export type ListBlock = BlockBase & { type: "list"; showIcons: boolean; trainable: boolean; rows: ListRow[] };

export type TextBlock = BlockBase & { type: "text"; collapsed: boolean; body: string };

export type SheetBlock = ChoiceBlock | StatSetBlock | ResourceBlock | ListBlock | TextBlock;

/** A character's sheet as the screens show it. */
export type CharacterSheet = {
  id: string;
  name: string;
  imageUrl: string | null;
  favorite: boolean;
  revision: number;
  blocks: SheetBlock[];
};

/** The character being built or edited, before it is saved. */
export type SheetDraft = { name: string; blocks: SheetBlock[] };
