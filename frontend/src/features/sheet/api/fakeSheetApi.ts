import { authClient } from "@/features/auth/api/authClient";
import { fakeCharacterList } from "@/features/characters/api/fakeCharactersApi";
import { LootbookApiError } from "@/shared/api/lootbookRequest";
import { fakeLatency } from "@/shared/config/devFakes";
import { FAKE_SHEET_BLOCKS } from "../data/fakeSheets";
import type { DerivedLink, NoteRow, ResourceRow, SheetDerivedValue, SheetDocument, StatRow } from "../types";
import { computeDerived } from "../utils/derived";
import { assignKeys, fromStored, toPayload } from "../utils/sheetMapping";
import type { SheetApi } from "./sheetApi";
import { ResourceChangedError, SheetConflictError } from "./sheetErrors";

/**
 * DEV ONLY. Sheets kept in the browser tab, stored in the back end's own shape (the document with a
 * revision, the rows of the existing tables, the links), so the screens go through the same mapping
 * as with the real back end. A new character also joins the fake character list.
 *
 * Triggers, for walking the failure states:
 * - a character whose name starts with "Offline" fails its first save (no connection); Retry works;
 * - a character whose name starts with "Stale" gets a conflict (409) on its first save;
 * - a resource whose block title starts with "Flaky" fails every change.
 */

type StoredRecord = {
  document: SheetDocument | null;
  revision: number;
  stats: StatRow[];
  resources: ResourceRow[];
  notes: NoteRow[];
  links: DerivedLink[];
};

const STORAGE_PREFIX = "lootbook.dev.fakeSheets.";
const READ_LATENCY_MS = 700;
const SAVE_LATENCY_MS = 750;
const CHANGE_LATENCY_MS = 300;

/** Names that already failed once in this tab, so Retry gets through. */
const failedOnce = new Set<string>();

async function storageKey() {
  const user = await authClient.currentUser();
  return STORAGE_PREFIX + (user?.id ?? "signed-out");
}

async function readStore(): Promise<Record<string, StoredRecord>> {
  try {
    const raw = window.sessionStorage.getItem(await storageKey());
    if (raw) return JSON.parse(raw) as Record<string, StoredRecord>;
  } catch {
    // Storage blocked: start from the seed.
  }
  return {};
}

async function writeStore(store: Record<string, StoredRecord>) {
  try {
    window.sessionStorage.setItem(await storageKey(), JSON.stringify(store));
  } catch {
    // Storage blocked: the change lasts until the page reloads.
  }
}

function seedRecord(id: string): StoredRecord {
  const blocks = FAKE_SHEET_BLOCKS[id];
  if (!blocks) return { document: null, revision: 0, stats: [], resources: [], notes: [], links: [] };
  const payload = toPayload(assignKeys(blocks));
  return { document: payload.document, revision: 1, ...rows(payload) };
}

function rows(payload: Pick<StoredRecord, "stats" | "resources" | "notes" | "links">) {
  return { stats: payload.stats, resources: payload.resources, notes: payload.notes, links: payload.links };
}

/** What `GET /sheet` would return in `derivedValues`: each declaration, in block and then `order` order. */
function derivedValues(record: StoredRecord): SheetDerivedValue[] {
  const statByKey = new Map(record.stats.map((row) => [row.key, row]));
  const linkByTarget = new Map(record.links.map((link) => [link.targetKey, link]));
  const values: SheetDerivedValue[] = [];
  for (const block of record.document?.blocks ?? []) {
    if (block.type !== "stats") continue;
    const sorted = [...block.derived].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    for (const decl of sorted) {
      const link = linkByTarget.get(decl.key);
      const source = link ? statByKey.get(link.sourceKey) : undefined;
      values.push({
        ...decl,
        blockId: block.id,
        value: link && source ? computeDerived(source.currentValue, link) : null,
      });
    }
  }
  return values;
}

function notFound(id: string) {
  return new LootbookApiError("The Lootbook back end answered 404.", 404, {
    error: "CharacterNotFoundError",
    details: { characterId: id },
  });
}

function offline() {
  return new LootbookApiError("Could not reach the Lootbook back end.", 0, null);
}

/**
 * The first save of an "Offline" or "Stale" character fails once, as the triggers above say. A new
 * character has no other device to conflict with, so "Stale" only applies to an existing one.
 */
function firstSaveFailure(name: string, existing: boolean): "offline" | "stale" | null {
  const lower = name.trim().toLowerCase();
  const kind = lower.startsWith("offline") ? "offline" : existing && lower.startsWith("stale") ? "stale" : null;
  if (!kind || failedOnce.has(lower)) return null;
  failedOnce.add(lower);
  return kind;
}

export const fakeSheetApi: SheetApi = {
  async getSheet(id) {
    await fakeLatency(READ_LATENCY_MS);
    const character = (await fakeCharacterList.read()).find((c) => c.id === id);
    if (!character) throw notFound(id);
    const store = await readStore();
    const record = store[id] ?? seedRecord(id);
    if (!store[id]) await writeStore({ ...store, [id]: record });
    return fromStored({
      character: { id, name: character.name, imageUrl: character.imageUrl, favorite: character.favorite },
      document: record.document,
      revision: record.revision,
      ...rows(record),
      derivedValues: derivedValues(record),
    });
  },

  async saveSheet(id, { name, baseRevision, payload }) {
    await fakeLatency(SAVE_LATENCY_MS);
    const store = await readStore();
    const record = store[id] ?? seedRecord(id);
    if (record.revision !== baseRevision) throw new SheetConflictError(record.revision);
    const failure = firstSaveFailure(name, true);
    if (failure === "offline") throw offline();
    if (failure === "stale") {
      // Another device saved meanwhile: the stored revision moves on, this save is refused.
      await writeStore({ ...store, [id]: { ...record, revision: record.revision + 1 } });
      throw new SheetConflictError(record.revision + 1);
    }
    const next: StoredRecord = { document: payload.document, revision: record.revision + 1, ...rows(payload) };
    await writeStore({ ...store, [id]: next });
    const list = await fakeCharacterList.read();
    await fakeCharacterList.write(
      list.map((c) =>
        c.id === id
          ? { ...c, name, subtitle: payload.summaryJson.card.subtitle, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
    return { revision: next.revision };
  },

  async createCharacter({ name, payload }) {
    await fakeLatency(SAVE_LATENCY_MS);
    if (firstSaveFailure(name, false) === "offline") throw offline();
    const id = `fake-${Date.now().toString(36)}`;
    const store = await readStore();
    await writeStore({ ...store, [id]: { document: payload.document, revision: 1, ...rows(payload) } });
    await fakeCharacterList.write([
      {
        id,
        name,
        imageUrl: null,
        subtitle: payload.summaryJson.card.subtitle,
        status: "ACTIVE",
        favorite: false,
        updatedAt: new Date().toISOString(),
      },
      ...(await fakeCharacterList.read()),
    ]);
    return { id };
  },

  async changeResource(id, key, change) {
    await fakeLatency(CHANGE_LATENCY_MS);
    const store = await readStore();
    const record = store[id] ?? seedRecord(id);
    const block = record.document?.blocks.find((b) => b.type === "resource" && b.resourceKeys.includes(key));
    if (block?.title.toLowerCase().startsWith("flaky")) throw offline();
    const row = record.resources.find((r) => r.key === key);
    if (!row) {
      throw new LootbookApiError("The Lootbook back end answered 404.", 404, {
        error: "ResourceNotFoundError",
        details: { characterId: id, key },
      });
    }
    const current = row.currentValue ?? 0;
    if ("set" in change && change.expectedCurrent !== null && change.expectedCurrent !== current) {
      throw new ResourceChangedError(current);
    }
    // one-value-write.md 2: floor at 0, ceiling at the maximum when there is one.
    const wanted = "adjust" in change ? current + change.adjust : change.set;
    const ceiling = row.maxValue ?? 99999999.99;
    const next = Math.min(ceiling, Math.max(0, wanted));
    const resources = record.resources.map((r) => (r.key === key ? { ...r, currentValue: next } : r));
    await writeStore({ ...store, [id]: { ...record, resources } });
    return { current: next, max: row.maxValue, clamped: next !== wanted };
  },
};
