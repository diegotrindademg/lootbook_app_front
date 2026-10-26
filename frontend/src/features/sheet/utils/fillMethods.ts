import type { SheetBlock, StatEntry, StatSetBlock } from "../types";

/**
 * How the four fill methods work, plain versions until "5 - Blocks" draws them. Nothing here is
 * enforced by the back end (sheet-document.md 2.4): the settings ride in `fillConfig`.
 */

export const DEFAULT_POOL = { total: 27, min: 8, max: 15 };
export const DEFAULT_ARRAY = [15, 14, 13, 12, 10, 8];
export const DEFAULT_ROLL = "4d6k3";

/** Point pool: each point above the lowest value costs one from the total. */
export function poolSpent(entries: StatEntry[], min: number) {
  return entries.reduce((sum, entry) => sum + Math.max(0, (entry.value ?? min) - min), 0);
}

/** "15, 14, 13" -> [15, 14, 13]; anything that is not a number is dropped. */
export function parseArray(text: string) {
  return text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && Math.abs(n) <= 999);
}

/** The array's values not given to any entry yet, in the array's order. */
export function unusedArrayValues(values: number[], entries: StatEntry[]) {
  const left = values.slice();
  for (const entry of entries) {
    const at = entry.value === null ? -1 : left.indexOf(entry.value);
    if (at >= 0) left.splice(at, 1);
  }
  return left;
}

/** "4d6k3+1": four six-sided dice, keep the highest three, add one. Null when it does not read. */
export function parseRoll(formula: string) {
  const match = formula.trim().toLowerCase().replace(/\s+/g, "").match(/^(\d{1,2})d(\d{1,3})(?:k(\d{1,2}))?([+-]\d{1,3})?$/);
  if (!match) return null;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const keep = match[3] ? Number(match[3]) : count;
  const bonus = match[4] ? Number(match[4]) : 0;
  if (count < 1 || sides < 2 || keep < 1 || keep > count) return null;
  return { count, sides, keep, bonus };
}

export type Roll = NonNullable<ReturnType<typeof parseRoll>>;

/** One roll: the total, the dice kept (highest first) and the dice dropped. */
export function rollOnce(roll: Roll, random = Math.random) {
  const dice = Array.from({ length: roll.count }, () => 1 + Math.floor(random() * roll.sides));
  dice.sort((a, b) => b - a);
  const kept = dice.slice(0, roll.keep);
  return { total: kept.reduce((sum, die) => sum + die, 0) + roll.bonus, kept, dropped: dice.slice(roll.keep) };
}

const SIDE_WORDS: Record<number, string> = {
  2: "two", 3: "three", 4: "four", 6: "six", 8: "eight", 10: "ten", 12: "twelve", 20: "twenty", 100: "hundred",
};

/** Figma page 5, T10: "Roll 4 six-sided dice, keep the best 3". */
export function describeRoll(roll: Roll) {
  const sides = SIDE_WORDS[roll.sides] ?? String(roll.sides);
  const dice = `${roll.count} ${sides}-sided ${roll.count === 1 ? "die" : "dice"}`;
  const keep = roll.keep < roll.count ? `, keep the best ${roll.keep}` : "";
  const bonus = roll.bonus ? `, ${roll.bonus > 0 ? "add" : "take away"} ${Math.abs(roll.bonus)}` : "";
  return `Roll ${dice}${keep}${bonus}`;
}

/** Figma page 5, T10: "Rolled 6, 5, 3, dropped 1". */
export function describeRolled(kept: number[], dropped: number[]) {
  return `Rolled ${kept.join(", ")}${dropped.length ? `, dropped ${dropped.join(", ")}` : ""}`;
}

/** A pool's Total, Lowest and Highest, from its settings or the defaults. */
export function poolSettings(block: StatSetBlock) {
  const config = block.fillConfig ?? {};
  return {
    total: typeof config.total === "number" ? config.total : DEFAULT_POOL.total,
    min: typeof config.min === "number" ? config.min : DEFAULT_POOL.min,
    max: typeof config.max === "number" ? config.max : DEFAULT_POOL.max,
  };
}

/**
 * Why Done is off in a block's configuration, or null. Figma page 5, T6: a point pool spent past its
 * total, or a value outside Lowest and Highest, blocks Done.
 */
export function configProblem(block: SheetBlock) {
  if (block.type !== "stats" || block.fill !== "pool") return null;
  const { total, min, max } = poolSettings(block);
  if (poolSpent(block.entries, min) > total) return "Lower a value to save this block";
  if (block.entries.some((e) => e.value !== null && (e.value < min || e.value > max))) return "A value is outside the pool";
  return null;
}
