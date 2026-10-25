import { DEV_FAKES_ENABLED } from "@/shared/config/devFakes";
import type { CharacterSheet, SheetPayload } from "../types";
import { fakeSheetApi } from "./fakeSheetApi";
import { httpSheetApi } from "./httpSheetApi";

export { ResourceChangedError, SheetConflictError } from "./sheetErrors";

/** A resource change at the table (one-value-write.md 2): add n, or set a value you last saw. */
export type ResourceChange = { adjust: number } | { set: number; expectedCurrent: number | null };

export type ResourceChangeResult = { current: number; max: number | null; clamped: boolean };

/**
 * What the editor and the sheet need from the back end. The screens only import `sheetApi`.
 * Shapes: LootBook `Tasks/Dev/kerley-specs/sheet-document.md` (the document with a revision, content
 * in the existing tables by key), `derived-values.md` and `one-value-write.md`.
 */
export interface SheetApi {
  /** GET /characters/:id/sheet. */
  getSheet(id: string): Promise<CharacterSheet>;
  /**
   * PUT /characters/:id/sheet-document with the content in the same call (3.3), the name when it
   * changed, and the derived value links. Resolves with the new revision; SheetConflictError on 409.
   */
  saveSheet(
    id: string,
    save: { name: string; nameChanged: boolean; baseRevision: number; payload: SheetPayload },
  ): Promise<{ revision: number }>;
  /** POST /characters with the document and its content (3.3): the draft becomes a character. */
  createCharacter(create: { name: string; payload: SheetPayload }): Promise<{ id: string }>;
  /** PATCH /characters/:id/resources/:key. Never retried by itself. */
  changeResource(id: string, key: string, change: ResourceChange): Promise<ResourceChangeResult>;
}

export const sheetApi: SheetApi = DEV_FAKES_ENABLED ? fakeSheetApi : httpSheetApi;
