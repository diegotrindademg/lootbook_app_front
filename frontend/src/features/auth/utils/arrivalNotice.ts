/**
 * A confirmation the next screen shows when a flow ends there: "Password changed" (Figma 2372:2198) and
 * "You are signed out." (page 7, A7 2425:36636). Kept in sessionStorage so it survives the navigation, read once.
 */
export type ArrivalNoticeKind = "password-changed" | "signed-out";

const STORAGE_KEY = "lootbook.arrivalNotice";

export function announceOnArrival(kind: ArrivalNoticeKind) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, kind);
  } catch {
    // Storage blocked: the user lands without the confirmation.
  }
}

export function takeArrivalNotice(): ArrivalNoticeKind | null {
  try {
    const kind = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return kind === "password-changed" || kind === "signed-out" ? kind : null;
  } catch {
    return null;
  }
}
