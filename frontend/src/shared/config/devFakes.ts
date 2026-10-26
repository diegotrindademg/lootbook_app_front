/**
 * Dev-only stand-ins for sign-in and the character list, so every screen can be walked with no
 * back end and no sign-in service. Turn them on with `NEXT_PUBLIC_LOOTBOOK_FAKE=1` in
 * `frontend/.env.development.local`. A production build never uses them, whatever the variable says.
 */
export const DEV_FAKES_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_LOOTBOOK_FAKE === "1";

/**
 * DEV ONLY. Failure switches for walking the error states (contract v1.1, 11): `?fake=offline` or
 * `?fake=fail-sheet,slow` on any address, kept for the tab until another `?fake=` (empty clears them).
 * - offline: every fake call fails as if there were no network, and the app shows the offline banner;
 *   signing out still works (it only forgets this device's session).
 * - fail-list, fail-sheet, fail-save, fail-play, fail-signin: that one call fails as if offline.
 * - slow: every fake call takes four times as long, to see the loading states.
 */
export const FAKE_SWITCHES = ["offline", "fail-list", "fail-sheet", "fail-save", "fail-play", "fail-signin", "slow"] as const;
export type FakeSwitch = (typeof FAKE_SWITCHES)[number];

const SWITCHES_KEY = "lootbook.dev.fakeSwitches";

function readSwitches(): FakeSwitch[] {
  if (!DEV_FAKES_ENABLED || typeof window === "undefined") return [];
  try {
    const param = new URLSearchParams(window.location.search).get("fake");
    if (param !== null) window.sessionStorage.setItem(SWITCHES_KEY, param);
    const raw = window.sessionStorage.getItem(SWITCHES_KEY) ?? "";
    return raw
      .split(",")
      .map((name) => name.trim())
      .filter((name): name is FakeSwitch => (FAKE_SWITCHES as readonly string[]).includes(name));
  } catch {
    return [];
  }
}

/** DEV ONLY. Whether a switch is on for this tab. Always false outside the dev fakes. */
export function fakeSwitch(name: FakeSwitch) {
  return readSwitches().includes(name);
}

/** DEV ONLY. Whether a fake call fails: the network is off, or this call's own switch is on. */
export function fakeFails(name: Exclude<FakeSwitch, "offline" | "slow">) {
  const on = readSwitches();
  return on.includes("offline") || on.includes(name);
}

/** Resolves after `ms`, so the fakes show the same loading and submitting states a network would. */
export function fakeLatency(ms: number) {
  const wait = fakeSwitch("slow") ? ms * 4 : ms;
  return new Promise<void>((resolve) => setTimeout(resolve, wait));
}
