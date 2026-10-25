import { fakeLatency } from "@/shared/config/devFakes";
import { AuthError, type AuthChangeListener, type AuthUser } from "../types";
import type { AuthClient } from "./authClient";

/**
 * DEV ONLY. A pretend sign-in service so every auth screen and state can be walked locally.
 * Never used in a production build (see shared/config/devFakes.ts).
 *
 * How to reach each state:
 * - password `wrong`                         -> "That password does not match"
 * - email starting with `nobody`             -> "No account for that email"
 * - create account with an email `taken...`  -> "That email already has an account"
 * - email starting with `empty`              -> signs in to an account with no characters
 * - /set-new-password?expired=1              -> "That link has expired"
 * - anything else                            -> signs in to an account with the fake list
 */
const STORAGE_KEY = "lootbook.dev.fakeAuthUser";
const LATENCY_MS = 900;
const listeners = new Set<AuthChangeListener>();

function readUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeUser(user: AuthUser | null) {
  try {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the session lasts until the page reloads.
  }
  listeners.forEach((listener) => listener(user));
}

function userFor(email: string): AuthUser {
  const local = email.split("@")[0] || "player";
  return {
    id: `fake-${local.toLowerCase()}`,
    email,
    displayName: local.charAt(0).toUpperCase() + local.slice(1),
    avatarUrl: "/images/charles_lourance.png",
  };
}

const RESET_KEY = "lootbook.dev.fakeResetEmail";

function pendingResetEmail() {
  try {
    return window.localStorage.getItem(RESET_KEY) || "lucien@example.com";
  } catch {
    return "lucien@example.com";
  }
}

export const fakeAuthClient: AuthClient = {
  async signIn(email, password) {
    await fakeLatency(LATENCY_MS);
    const lower = email.trim().toLowerCase();
    if (lower.startsWith("nobody")) throw new AuthError("no-account");
    if (password === "wrong") throw new AuthError("wrong-password");
    const user = userFor(email.trim());
    writeUser(user);
    return user;
  },
  async signUp(email) {
    await fakeLatency(LATENCY_MS);
    if (email.trim().toLowerCase().startsWith("taken")) throw new AuthError("email-taken");
  },
  async resendConfirmation() {
    await fakeLatency(LATENCY_MS);
  },
  async signInWithProvider(provider) {
    await fakeLatency(LATENCY_MS);
    const user = { ...userFor(`lucien.${provider}@example.com`), displayName: "Lucien" };
    writeUser(user);
    return user;
  },
  async resetPassword(email) {
    await fakeLatency(LATENCY_MS);
    try {
      // The reset link opens a fresh page, so the fake keeps the email where that page can read it.
      if (email.trim()) window.localStorage.setItem(RESET_KEY, email.trim());
    } catch {
      // Storage blocked: the fake signs in as its default account.
    }
  },
  async checkResetLink() {
    return new URLSearchParams(window.location.search).get("expired") === "1" ? "expired" : "valid";
  },
  async setNewPassword() {
    await fakeLatency(LATENCY_MS);
    const user = userFor(pendingResetEmail());
    writeUser(user);
    return user;
  },
  async signOut() {
    writeUser(null);
  },
  async currentUser() {
    return readUser();
  },
  async getAccessToken() {
    // The fake list never calls the back end, so there is no token to give.
    return null;
  },
  onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
