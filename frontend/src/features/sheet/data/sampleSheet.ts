import type { CharacterSheet, SheetBlock } from "../types";

/**
 * The sample character's blocks (plan M0, S6), from the design's "Rafa Delgado": a sheet with no
 * stats, levels or gear, built to prove a character needs none of them. Shown read only.
 */
export const SAMPLE_BLOCKS: SheetBlock[] = [
  {
    id: "r1", type: "choice", title: "Who you were before", icon: "map", pinned: false, density: "full", preset: null,
    mode: "one",
    options: [
      { id: "driver", name: "Getaway driver", description: "Four years of other people's worst nights, and never once late." },
      { id: "bartender", name: "Bartender at the Cassia" },
      { id: "fixer", name: "Union fixer" },
    ],
    value: "driver",
  },
  {
    id: "r2", type: "choice", title: "What the crew believes", icon: "star", pinned: false, density: "full", preset: null,
    mode: "text", options: [], value: "Says he's out. Keeps the car warm anyway.",
  },
  {
    id: "r3", type: "resource", title: "Composure", icon: "eye", pinned: true, density: "half", preset: null,
    model: "pips", reset: { mode: "session" },
    tiers: [{ key: "composure", localId: "composure", label: "Composure", current: 3, max: 5 }],
  },
  {
    id: "r4", type: "resource", title: "Favours owed to you", icon: "users", pinned: true, density: "half", preset: null,
    model: "counter", reset: { mode: "manual" },
    tiers: [{ key: "favours", localId: "favours", label: "Favours owed to you", current: 1, max: 3 }],
  },
  {
    id: "r5", type: "list", title: "Bonds", icon: "users", pinned: false, density: "full", preset: null, showIcons: false, trainable: false,
    rows: [
      { id: "nadia", name: "Nadia, his sister", note: "Thinks he sells insurance. He lets her." },
      { id: "curic", name: "Ćurić", note: "Holds the debt. Patient about it, which is worse." },
      { id: "cassia", name: "The Cassia crew", note: "Would come if he called. He will not call." },
      { id: "reyes", name: "Officer Reyes", note: "Grew up two doors down. Neither has ever said so." },
    ],
  },
  {
    id: "r6", type: "text", title: "How the last job ended", icon: "scroll", pinned: false, density: "full", preset: null,
    collapsed: false,
    body:
      "Everyone got out. The money did not, and the man who planned it is still deciding whose fault that was.\n" +
      "Rafa drove home the long way, and has taken the long way every night since.",
  },
  {
    id: "r7", type: "text", title: "Rules he drives by", icon: "pen", pinned: false, density: "full", preset: null,
    collapsed: false,
    body:
      "Never the same car twice. Never park facing a wall. Never ask what is in the bag, knowing is what gets you asked to carry it again.",
  },
];

/** The sample character's sheet, opened from the sample card on the empty list, read only. */
export const SAMPLE_SHEET: CharacterSheet = {
  id: "sample",
  name: "Rafa Delgado",
  imageUrl: "/images/charles_lourance.png",
  favorite: false,
  revision: 0,
  blocks: SAMPLE_BLOCKS,
};

export const SAMPLE_SHEET_PATH = "/characters/sample";
