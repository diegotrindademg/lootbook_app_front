import type { SheetBlock, StatEntry } from "../types";
import { SAMPLE_BLOCKS } from "./sampleSheet";

/**
 * DEV ONLY. Sheets for the fake characters of the first slice (features/characters/data), from the
 * design's demo set. Reset words follow M0: no short or long rest; a label the user typed shows how
 * that reads.
 */

function modifierEntry(key: string, name: string, abbr: string, value: number): StatEntry {
  return {
    key,
    localId: key,
    name,
    abbr,
    value,
    derived: {
      key: `${key}_mod`,
      label: `${name} modifier`,
      order: 0,
      signed: true,
      multiplier: 0.5,
      offset: -5,
      rounding: "floor",
      value: null,
    },
  };
}

const BRAKKA: SheetBlock[] = [
  {
    id: "f1", type: "choice", title: "Origin", icon: "map", pinned: false, density: "full", preset: "background",
    mode: "one",
    options: [
      { id: "ironhold", name: "Ironhold", description: "Mountain-hold born. Stone-sense, and a long memory for debts." },
      { id: "saltmarsh", name: "Saltmarsh" },
      { id: "reach", name: "The Reach" },
    ],
    value: "ironhold",
  },
  {
    id: "f2", type: "choice", title: "Calling", icon: "sword", pinned: false, density: "full", preset: "class",
    mode: "one",
    options: [
      {
        id: "shieldbreaker",
        name: "Shieldbreaker",
        description: "Front line. Breaks formations and holds the gap.",
        art: "/images/raceImages/fighter.png",
      },
      { id: "warden", name: "Warden" },
      { id: "skirmisher", name: "Skirmisher" },
    ],
    value: "shieldbreaker",
  },
  {
    id: "f0", type: "choice", title: "Concept", icon: "star", pinned: false, density: "full", preset: "concept",
    mode: "text", options: [], value: "The Unbroken, holds the gate at Ironhold",
  },
  {
    id: "f3", type: "stats", title: "Attributes", icon: "dice", pinned: false, density: "half", preset: "attributes",
    fill: "pool", fillConfig: { total: 27, min: 8, max: 16 },
    entries: [
      modifierEntry("might", "Might", "MGT", 16),
      modifierEntry("agility", "Agility", "AGI", 12),
      modifierEntry("grit", "Grit", "GRT", 15),
      modifierEntry("wits", "Wits", "WIT", 10),
      modifierEntry("sense", "Sense", "SNS", 13),
      modifierEntry("presence", "Presence", "PRS", 8),
    ],
  },
  {
    id: "f4", type: "resource", title: "Health", icon: "heart", pinned: true, density: "half", preset: "hp",
    model: "gauge", reset: { mode: "session" },
    tiers: [{ key: "health", localId: "health", label: "Health", current: 34, max: 42 }],
  },
  {
    id: "f5", type: "resource", title: "Second Wind", icon: "flame", pinned: true, density: "half", preset: "customres",
    model: "pips", reset: { mode: "label", label: "a short break" },
    tiers: [{ key: "second_wind", localId: "second_wind", label: "Second Wind", current: 1, max: 2 }],
  },
  {
    id: "f6", type: "resource", title: "Grit dice", icon: "dice", pinned: true, density: "half", preset: "customres",
    model: "counter", reset: { mode: "session" },
    tiers: [{ key: "grit_dice", localId: "grit_dice", label: "Grit dice", current: 3, max: 5 }],
  },
  {
    id: "f7", type: "list", title: "Skills", icon: "target", pinned: false, density: "full", preset: "skills", showIcons: false,
    rows: [
      { id: "athletics", name: "Athletics", value: "+6", attribute: "Might", trained: true },
      { id: "intimidation", name: "Intimidation", value: "+3", attribute: "Presence", trained: true },
      { id: "perception", name: "Perception", value: "+4", attribute: "Sense", trained: false },
      { id: "survival", name: "Survival", value: "+4", attribute: "Sense", trained: true },
    ],
  },
  {
    id: "f8", type: "list", title: "Gear", icon: "backpack", pinned: false, density: "full", preset: "customlist", showIcons: true,
    rows: [
      { id: "warhammer", name: "Warhammer", icon: "sword" },
      { id: "tower", name: "Tower shield", icon: "shield" },
      { id: "chain", name: "Chain mail", icon: "shield" },
      { id: "draught", name: "Healing draught ×3", icon: "potion" },
      { id: "rations", name: "Rations, 5 days", icon: "backpack" },
    ],
  },
  {
    id: "f9", type: "text", title: "Backstory", icon: "scroll", pinned: false, density: "full", preset: "bio", collapsed: false,
    body:
      "Third daughter of a gate-warden line. When the Reach came over the pass she held the inner door for two days with a broken shield arm, and nobody in Ironhold has called her anything but the Unbroken since.\n" +
      "She left when the peace was signed. Peace, she says, is when the debts get quiet.",
  },
];

const SORREL: SheetBlock[] = [
  {
    id: "s1", type: "choice", title: "Path", icon: "sparkles", pinned: false, density: "full", preset: "class",
    mode: "one",
    options: [
      { id: "hexwright", name: "Hexwright", description: "Bargains written in ink that is not quite ink." },
      { id: "seer", name: "Seer" },
    ],
    value: "hexwright",
  },
  {
    id: "s0", type: "choice", title: "Concept", icon: "star", pinned: false, density: "full", preset: "concept",
    mode: "text", options: [], value: "Owes a name to something under the lake",
  },
  {
    id: "s2", type: "resource", title: "Health", icon: "heart", pinned: true, density: "half", preset: "hp",
    model: "gauge", reset: { mode: "session" },
    tiers: [{ key: "health", localId: "health", label: "Health", current: 21, max: 28 }],
  },
  {
    id: "s3", type: "resource", title: "Spell slots", icon: "sparkles", pinned: true, density: "half", preset: "slots",
    model: "tiered", reset: { mode: "session" },
    tiers: [
      { key: "slots_1st", localId: "slots_1st", label: "1st", current: 3, max: 4 },
      { key: "slots_2nd", localId: "slots_2nd", label: "2nd", current: 1, max: 3 },
      { key: "slots_3rd", localId: "slots_3rd", label: "3rd", current: 2, max: 2 },
    ],
  },
  {
    id: "s4", type: "stats", title: "Attributes", icon: "dice", pinned: false, density: "half", preset: "attributes",
    fill: "array", fillConfig: { values: [17, 14, 13, 12, 10, 8] },
    entries: [
      modifierEntry("might", "Might", "MGT", 8),
      modifierEntry("agility", "Agility", "AGI", 14),
      modifierEntry("grit", "Grit", "GRT", 12),
      modifierEntry("wits", "Wits", "WIT", 13),
      modifierEntry("sense", "Sense", "SNS", 10),
      modifierEntry("presence", "Presence", "PRS", 17),
    ],
  },
  {
    id: "s5", type: "list", title: "Known spells", icon: "book", pinned: false, density: "full", preset: "feats", showIcons: true,
    rows: [
      { id: "hex", name: "Hex of the Drowned", note: "1st · curse", icon: "sparkles" },
      { id: "lantern", name: "Lantern Step", note: "2nd · movement", icon: "bolt" },
      { id: "lake", name: "Ask the Lake", note: "3rd · divination", icon: "eye" },
    ],
  },
];

const WREN: SheetBlock[] = [
  {
    id: "w1", type: "text", title: "Notes", icon: "pen", pinned: false, density: "full", preset: "notes", collapsed: false,
    body: "Wandering cartographer. Owes the Guild a map of the drowned coast.\nTravels with a one-eyed mule called Saint.",
  },
];

/** Blocks for each seeded fake character id; any other character starts with no sheet. */
export const FAKE_SHEET_BLOCKS: Record<string, SheetBlock[]> = {
  "fake-brakka": BRAKKA,
  "fake-rafa": SAMPLE_BLOCKS,
  "fake-wren": WREN,
  "fake-sorrel": SORREL,
};
