import type { SheetDraft } from "../types";

/**
 * The draft kept on this device until it is saved (Kerley, Oct 25: no back end change). It survives
 * a reload and the whole sign-in round trip. One for a new character, one per character being
 * edited, with the revision the edit started from and what the sheet held then.
 */
export type DeviceDraft = {
  version: 1;
  characterId: string | null;
  baseRevision: number;
  /** The sheet as it was opened, so Cancel knows whether anything changed. Null for a new character. */
  original: SheetDraft | null;
  draft: SheetDraft;
};

const PREFIX = "lootbook.draft.";

function storageKey(characterId: string | null) {
  return PREFIX + (characterId ?? "new");
}

export function readDeviceDraft(characterId: string | null): DeviceDraft | null {
  try {
    const raw = window.localStorage.getItem(storageKey(characterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceDraft;
    return parsed.version === 1 && parsed.draft ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDeviceDraft(value: DeviceDraft) {
  try {
    window.localStorage.setItem(storageKey(value.characterId), JSON.stringify(value));
  } catch {
    // Storage blocked or full: the draft stays on screen, it just will not survive a reload.
  }
}

export function clearDeviceDraft(characterId: string | null) {
  try {
    window.localStorage.removeItem(storageKey(characterId));
  } catch {
    // Nothing to clear.
  }
}

/** The new character's name, for the sign-in screens reached from Save ("Save your character"). */
export function readNewDraftName() {
  const stored = typeof window === "undefined" ? null : readDeviceDraft(null);
  const name = stored?.draft.name.trim();
  return name ? name : null;
}

/** Where sign-in returns to after Save: the editor, which then saves the draft at once. */
export const RESUME_NEW_DRAFT_PATH = "/characters/create?resume=1";
