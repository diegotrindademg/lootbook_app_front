import type { DerivedEntry, Rounding } from "../types";

/** Four decimals, as the back end stores a computed value (calculator.ts `round`). */
function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

function applyRounding(value: number, rounding: Rounding) {
  if (rounding === "floor") return Math.floor(value);
  if (rounding === "ceil") return Math.ceil(value);
  // A half goes up, toward +infinity, as the back end does.
  if (rounding === "round") return Math.floor(value + 0.5);
  return value;
}

/**
 * The derived value for an entry's number, the way the back end's calculator gets it: the number
 * times the multiplier plus the offset, cleaned to four decimals, then rounded (derived-values.md 3,
 * with the one-line fix, so 100 x 0.29 floors to 29).
 */
export function computeDerived(score: number | null, formula: Pick<DerivedEntry, "multiplier" | "offset" | "rounding">) {
  if (score === null || !Number.isFinite(score)) return null;
  return applyRounding(round4(score * formula.multiplier + formula.offset), formula.rounding);
}

/** "+2", "-1", "0" for a modifier; "12" for a plain number. */
export function formatDerived(value: number | null, signed: boolean) {
  if (value === null) return "";
  const text = Number.isInteger(value) ? String(value) : String(round4(value));
  return signed && value > 0 ? `+${text}` : text;
}

/** The usual "half the score, minus five, rounded down" modifier a new derived value starts from. */
export const DEFAULT_DERIVED_FORMULA = { multiplier: 0.5, offset: -5, rounding: "floor" as Rounding };
