/**
 * Ids and keys for the sheet document (sheet-document.md 2.2 and 2.3).
 * - Block, option and row ids: `^[a-z][a-z0-9_-]{0,39}$`, unique where they live, never reused.
 * - Stat and resource keys: `^[a-z][a-z0-9_:-]*$`, max 80, a slug of the name made unique in the
 *   character, given once and never changed on rename, so nothing that points at a key breaks.
 */

let sequence = 0;

/** A fresh id such as "b1k2x9a3": a letter, the time in base 36 and a counter. */
export function mintId(prefix: "b" | "o" | "r" | "e" | "t") {
  sequence = (sequence + 1) % 1296;
  return `${prefix}${Date.now().toString(36)}${sequence.toString(36).padStart(2, "0")}`.slice(0, 40);
}

/** "Hit points (max)" -> "hit_points_max"; anything with no letters falls back to `fallback`. */
export function slugKey(name: string, fallback: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/, "")
    .slice(0, 60);
  return slug || fallback;
}

/** `base`, or `base_2`, `base_3`... whichever is not taken yet. Adds the result to `taken`. */
export function uniqueKey(base: string, taken: Set<string>) {
  let key = base;
  for (let n = 2; taken.has(key); n += 1) key = `${base}_${n}`;
  taken.add(key);
  return key;
}
