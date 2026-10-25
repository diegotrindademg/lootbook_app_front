/**
 * Dev-only stand-ins for sign-in and the character list, so every screen can be walked with no
 * back end and no sign-in service. Turn them on with `NEXT_PUBLIC_LOOTBOOK_FAKE=1` in
 * `frontend/.env.development.local`. A production build never uses them, whatever the variable says.
 */
export const DEV_FAKES_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_LOOTBOOK_FAKE === "1";

/** Resolves after `ms`, so the fakes show the same loading and submitting states a network would. */
export function fakeLatency(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
