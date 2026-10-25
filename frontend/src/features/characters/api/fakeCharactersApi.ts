import { authClient } from "@/features/auth/api/authClient";
import { fakeLatency } from "@/shared/config/devFakes";
import { FAKE_CHARACTERS } from "../data/fakeCharacters";
import type { CharacterSummary } from "../types";
import type { CharactersApi } from "./charactersApi";

/**
 * DEV ONLY. The character list kept in the browser tab, one list per fake account.
 * An account whose email starts with `empty` starts with no characters; any other starts with
 * FAKE_CHARACTERS. Changes last until the tab closes.
 */
const STORAGE_PREFIX = "lootbook.dev.fakeCharacters.";
const LIST_LATENCY_MS = 2300;
const ACTION_LATENCY_MS = 400;

async function storageKey() {
  const user = await authClient.currentUser();
  return { key: STORAGE_PREFIX + (user?.id ?? "signed-out"), email: user?.email ?? "" };
}

async function readList(): Promise<CharacterSummary[]> {
  const { key, email } = await storageKey();
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw) as CharacterSummary[];
  } catch {
    // Storage blocked: start from the seed every time.
  }
  return email.toLowerCase().startsWith("empty") ? [] : FAKE_CHARACTERS.map((c) => ({ ...c }));
}

async function writeList(list: CharacterSummary[]) {
  const { key } = await storageKey();
  try {
    window.sessionStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage blocked: the change shows on screen only.
  }
}

async function update(id: string, change: Partial<CharacterSummary>) {
  await fakeLatency(ACTION_LATENCY_MS);
  const list = await readList();
  const next = list.map((c) =>
    c.id === id ? { ...c, ...change, updatedAt: new Date().toISOString() } : c,
  );
  await writeList(next);
  const updated = next.find((c) => c.id === id);
  if (!updated) throw new Error(`No fake character ${id}`);
  return updated;
}

/** DEV ONLY. The same fake list, for the fake sheet adapter: a saved new character joins it. */
export const fakeCharacterList = { read: readList, write: writeList };

export const fakeCharactersApi: CharactersApi = {
  async list() {
    await fakeLatency(LIST_LATENCY_MS);
    return readList();
  },
  rename: (id, name) => update(id, { name }),
  archive: (id) => update(id, { status: "ARCHIVED" }),
  unarchive: (id) => update(id, { status: "ACTIVE" }),
  async remove(id) {
    await fakeLatency(ACTION_LATENCY_MS);
    await writeList((await readList()).filter((c) => c.id !== id));
  },
  async duplicate(source) {
    await fakeLatency(ACTION_LATENCY_MS);
    const copy: CharacterSummary = {
      ...source,
      id: `fake-copy-${Date.now().toString(36)}`,
      // The design's wording (01.9), which the back end follows too.
      name: `${source.name} copy`,
      status: source.status === "ARCHIVED" ? "ACTIVE" : source.status,
      favorite: false,
      updatedAt: new Date().toISOString(),
    };
    await writeList([copy, ...(await readList())]);
    return copy;
  },
  setFavorite: (id, favorite) => update(id, { favorite }),
};
