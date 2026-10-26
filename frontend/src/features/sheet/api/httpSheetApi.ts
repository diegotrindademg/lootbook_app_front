import { LootbookApiError, lootbookRequest } from "@/shared/api/lootbookRequest";
import type {
  DerivedLink,
  NoteRow,
  ResourceRow,
  Rounding,
  SheetDerivedValue,
  SheetDocument,
  StatRow,
} from "../types";
import { fromStored } from "../utils/sheetMapping";
import type { SheetApi } from "./sheetApi";
import { ResourceChangedError, SheetConflictError } from "./sheetErrors";

/**
 * The sheet against Kerley's back end. This is the one file that changes when his routes land:
 * - GET  /characters/:id/sheet gains `document`, `revision` (sheet-document.md 3.2) and
 *   `derivedValues` (derived-values.md 4);
 * - PUT  /characters/:id/sheet-document takes the document with `stats`, `resources` and `notes`
 *   in one call (3.3, recommended). If Kerley keeps the fallback instead, `saveSheet` calls, in this
 *   order: PUT /stats, PUT /resources, PUT /notes, then PUT /sheet-document last, so the document
 *   never points at content that is missing;
 * - POST /characters takes `document`, `stats`, `resources`, `notes` and `summaryJson` (3.3);
 * - PATCH /characters/:id/resources/:key changes one value (one-value-write.md 3).
 * Derived value formulas are links (derived-values.md 2.2): there is no PATCH for a link, so a
 * changed formula is deleted and created again.
 */

type ApiCharacter = {
  id: string;
  name: string;
  portraitUrl: string | null;
  isFavorite?: boolean;
};

type ApiLink = {
  id: string;
  source: { type: string; id: string };
  target: { type: string; id: string };
  operation: string;
  configJson: Record<string, unknown> | null;
};

type ApiSheet = {
  character: ApiCharacter;
  stats: StatRow[];
  resources: ResourceRow[];
  notes: NoteRow[];
  links: ApiLink[];
  document?: SheetDocument | null;
  revision?: number;
  derivedValues?: SheetDerivedValue[];
};

const ROUNDINGS: Rounding[] = ["floor", "ceil", "round", "none"];

/** The derived value links among a character's links. */
function derivedLinks(links: ApiLink[]): DerivedLink[] {
  return links
    .filter((link) => link.operation === "SET_FROM_STAT" && link.source.type === "STAT" && link.target.type === "DERIVED")
    .map((link) => {
      const config = link.configJson ?? {};
      const rounding = ROUNDINGS.includes(config.rounding as Rounding) ? (config.rounding as Rounding) : "none";
      return {
        id: link.id,
        sourceKey: link.source.id,
        targetKey: link.target.id,
        multiplier: typeof config.multiplier === "number" ? config.multiplier : 1,
        offset: typeof config.offset === "number" ? config.offset : 0,
        rounding,
      };
    });
}

function sameFormula(a: DerivedLink, b: DerivedLink) {
  return (
    a.sourceKey === b.sourceKey &&
    a.targetKey === b.targetKey &&
    a.multiplier === b.multiplier &&
    a.offset === b.offset &&
    a.rounding === b.rounding
  );
}

/** Makes the character's derived value links match the ones the sheet declares. */
async function syncLinks(id: string, wanted: DerivedLink[]) {
  const { links } = await lootbookRequest<{ links: ApiLink[] }>(`/characters/${id}/links`);
  const existing = derivedLinks(links);
  const keep = existing.filter((link) => wanted.some((w) => sameFormula(w, link)));
  for (const link of existing) {
    if (!keep.includes(link)) {
      await lootbookRequest<void>(`/characters/${id}/links/${link.id}`, { method: "DELETE" });
    }
  }
  for (const link of wanted) {
    if (keep.some((k) => sameFormula(k, link))) continue;
    await lootbookRequest(`/characters/${id}/links`, {
      method: "POST",
      body: JSON.stringify({
        source: { type: "STAT", id: link.sourceKey },
        target: { type: "DERIVED", id: link.targetKey },
        operation: "SET_FROM_STAT",
        configJson: { multiplier: link.multiplier, offset: link.offset, rounding: link.rounding },
      }),
    });
  }
}

function errorDetails(error: unknown): Record<string, unknown> {
  if (!(error instanceof LootbookApiError) || !error.responseBody || typeof error.responseBody !== "object") return {};
  const details = (error.responseBody as { details?: unknown }).details;
  return details && typeof details === "object" ? (details as Record<string, unknown>) : {};
}

export const httpSheetApi: SheetApi = {
  // TODO(Kerley): `document` and `revision` on GET /sheet (sheet-document.md 3.2), `derivedValues` (derived-values.md 4).
  async getSheet(id) {
    const { sheet } = await lootbookRequest<{ sheet: ApiSheet }>(`/characters/${id}/sheet`);
    return fromStored({
      character: {
        id: sheet.character.id,
        name: sheet.character.name,
        imageUrl: sheet.character.portraitUrl,
        favorite: sheet.character.isFavorite ?? false,
      },
      document: sheet.document ?? null,
      revision: sheet.revision ?? 0,
      stats: sheet.stats,
      resources: sheet.resources,
      notes: sheet.notes,
      links: derivedLinks(sheet.links),
      derivedValues: sheet.derivedValues ?? [],
    });
  },

  // TODO(Kerley): new route PUT /sheet-document with the content in one call (sheet-document.md 3.1, 3.3); 409 with details.currentRevision.
  async saveSheet(id, { name, nameChanged, baseRevision, payload }) {
    let revision: number;
    try {
      ({ revision } = await lootbookRequest<{ revision: number }>(`/characters/${id}/sheet-document`, {
        method: "PUT",
        body: JSON.stringify({
          baseRevision,
          document: payload.document,
          summaryJson: payload.summaryJson,
          stats: payload.stats,
          resources: payload.resources,
          notes: payload.notes,
        }),
      }));
    } catch (error) {
      if (error instanceof LootbookApiError && error.status === 409) {
        const current = errorDetails(error).currentRevision;
        throw new SheetConflictError(typeof current === "number" ? current : baseRevision);
      }
      throw error;
    }
    if (nameChanged) {
      await lootbookRequest(`/characters/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
    }
    await syncLinks(id, payload.links);
    return { revision };
  },

  // TODO(Kerley): POST /characters takes the document and its content (sheet-document.md 3.3).
  async createCharacter({ name, payload }) {
    const { character } = await lootbookRequest<{ character: ApiCharacter }>("/characters", {
      method: "POST",
      body: JSON.stringify({
        name,
        document: payload.document,
        summaryJson: payload.summaryJson,
        stats: payload.stats,
        resources: payload.resources,
        notes: payload.notes,
      }),
    });
    if (payload.links.length) await syncLinks(character.id, payload.links);
    return { id: character.id };
  },

  // TODO(Kerley): new route, one-value-write.md 3; 409 with details.currentValue (3.1).
  async changeResource(id, key, change) {
    try {
      const { resource, clamped } = await lootbookRequest<{
        resource: { currentValue: number | null; maxValue: number | null };
        clamped: boolean;
      }>(`/characters/${id}/resources/${encodeURIComponent(key)}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      return { current: resource.currentValue ?? 0, max: resource.maxValue, clamped };
    } catch (error) {
      if (error instanceof LootbookApiError && error.status === 409) {
        const current = errorDetails(error).currentValue;
        if (typeof current === "number") throw new ResourceChangedError(current);
      }
      throw error;
    }
  },
};
