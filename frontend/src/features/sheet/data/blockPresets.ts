import type {
  BlockIconKey,
  BlockType,
  ChoiceMode,
  FillMethod,
  ResetRule,
  ResourceModel,
} from "../types";

/**
 * The block library: twenty presets on five shelves, every one shipped empty (design `BLOCK_PRESETS`,
 * plan M0 L1). Reset words follow M0 and contract v1.1: health, energy and slots reset each session,
 * a custom resource manually.
 */
export type BlockPreset = {
  key: string;
  title: string;
  icon: BlockIconKey;
  type: BlockType;
  mode?: ChoiceMode;
  fill?: FillMethod;
  model?: ResourceModel;
  reset?: ResetRule;
  showIcons?: boolean;
};

export type PresetShelf = { title: string; presets: BlockPreset[] };

const EACH_SESSION: ResetRule = { mode: "session" };
const MANUAL: ResetRule = { mode: "manual" };

export const BLOCK_PRESET_SHELVES: PresetShelf[] = [
  {
    title: "Identity & origin",
    presets: [
      { key: "class", title: "Class", icon: "sword", type: "choice", mode: "one" },
      { key: "race", title: "Race / Ancestry", icon: "users", type: "choice", mode: "one" },
      { key: "background", title: "Background", icon: "map", type: "choice", mode: "one" },
      { key: "concept", title: "Concept", icon: "star", type: "choice", mode: "text" },
      { key: "bio", title: "Bio / Backstory", icon: "scroll", type: "text" },
      { key: "appearance", title: "Appearance", icon: "eye", type: "text" },
      { key: "goals", title: "Goals / Bonds", icon: "target", type: "list" },
    ],
  },
  {
    title: "Numbers",
    presets: [
      { key: "attributes", title: "Attributes", icon: "dice", type: "stats", fill: "pool" },
      { key: "customstats", title: "Custom stat set", icon: "dice", type: "stats", fill: "free" },
    ],
  },
  {
    title: "Resources",
    presets: [
      { key: "hp", title: "HP / Health", icon: "heart", type: "resource", model: "gauge", reset: EACH_SESSION },
      { key: "mana", title: "Mana / Energy", icon: "bolt", type: "resource", model: "gauge", reset: EACH_SESSION },
      { key: "slots", title: "Spell slots", icon: "sparkles", type: "resource", model: "tiered", reset: EACH_SESSION },
      { key: "customres", title: "Custom resource", icon: "potion", type: "resource", model: "counter", reset: MANUAL },
    ],
  },
  {
    title: "Capabilities",
    presets: [
      { key: "skills", title: "Skills", icon: "target", type: "list" },
      { key: "proficiencies", title: "Proficiencies", icon: "shield", type: "list" },
      { key: "feats", title: "Feats / Abilities", icon: "sparkles", type: "list", showIcons: true },
      { key: "customlist", title: "Custom list", icon: "book", type: "list" },
    ],
  },
  {
    title: "Freeform",
    presets: [
      { key: "notes", title: "Notes", icon: "pen", type: "text" },
      { key: "custom", title: "Custom section", icon: "book", type: "text" },
    ],
  },
];

/** The word under each library entry and on each block row. */
export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  choice: "Choice",
  stats: "Stat set",
  resource: "Resource",
  list: "List",
  text: "Text",
};
