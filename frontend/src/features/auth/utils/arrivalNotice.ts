/**
 * A confirmation the next screen shows when the sign-in flow ends there (for now only "Password
 * changed", Figma 2372:2198). Kept in sessionStorage so it survives the navigation, read once.
 */
export type ArrivalNoticeKind = "password-changed";

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
    return kind === "password-changed" ? kind : null;
  } catch {
    return null;
  }
}
