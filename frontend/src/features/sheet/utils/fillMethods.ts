import type { StatEntry } from "../types";

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

export function rollOnce(roll: NonNullable<ReturnType<typeof parseRoll>>, random = Math.random) {
  const dice = Array.from({ length: roll.count }, () => 1 + Math.floor(random() * roll.sides));
  dice.sort((a, b) => b - a);
  return dice.slice(0, roll.keep).reduce((sum, die) => sum + die, 0) + roll.bonus;
}
