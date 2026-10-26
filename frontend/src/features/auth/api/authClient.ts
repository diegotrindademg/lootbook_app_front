import { DEV_FAKES_ENABLED } from "@/shared/config/devFakes";
import { AuthError, type AuthChangeListener, type AuthProvider, type AuthUser } from "../types";
import { deferredAuthClient } from "./deferredAuthClient";
import { fakeAuthClient } from "./fakeAuthClient";

/**
 * Everything the screens need from sign-in, and nothing about how it is done.
 * The screens only ever import `authClient` from this file.
 */
export interface AuthClient {
  /** Rejects with AuthError "wrong-password" or "no-account". */
  signIn(email: string, password: string): Promise<AuthUser>;
  /** Creates the account and sends the confirmation email. Rejects with "email-taken". */
  signUp(email: string, password: string): Promise<void>;
  /** Sends the confirmation email again. */
  resendConfirmation(email: string): Promise<void>;
  /** Google or Apple. A real client may leave the page and come back signed in. */
  signInWithProvider(provider: AuthProvider): Promise<AuthUser | null>;
  /** Sends the reset link. Never says whether the email has an account. */
  resetPassword(email: string): Promise<void>;
  /** Whether the reset link that opened the page can still be used. */
  checkResetLink(): Promise<"valid" | "expired">;
  /** Called from the page the reset link opens; ends signed in. Rejects with "link-expired". */
  setNewPassword(password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  currentUser(): Promise<AuthUser | null>;
  /** The token every back end request carries, see shared/api/lootbookRequest.ts. */
  getAccessToken(): Promise<string | null>;
  /** Called with the new user (or null) whenever sign-in changes. Returns the unsubscribe. */
  onChange(listener: AuthChangeListener): () => void;
}

const notConnected = () => Promise.reject(new AuthError("not-connected"));

/**
 * With no Supabase project set, every call fails with "not-connected", the list is read without a
 * token (a development back end answers as its guest user), and the screens still render.
 */
const notConnectedAuthClient: AuthClient = {
  signIn: notConnected,
  signUp: notConnected,
  resendConfirmation: notConnected,
  signInWithProvider: notConnected,
  resetPassword: notConnected,
  checkResetLink: async () => "valid",
  setNewPassword: notConnected,
  signOut: async () => undefined,
  currentUser: async () => null,
  getAccessToken: async () => null,
  onChange: () => () => undefined,
};

/**
 * The fake in development with NEXT_PUBLIC_LOOTBOOK_FAKE=1; Supabase when both variables are set;
 * not connected otherwise.
 * TODO(Kerley): the Supabase client is a DRAFT, tested against a mock only (supabaseAuthClient.ts and
 * docs/FRONTEND_V1.md); it needs your OK and your project's URL and anon key before it is used.
 */
function pickAuthClient(): AuthClient {
  if (DEV_FAKES_ENABLED) return fakeAuthClient;
  // Written out in full, not through variables, so a build without them leaves supabase-js (about
  // 65 kB on every page) out of the bundle; with them it loads on the first sign-in call.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return deferredAuthClient(async () => {
      const [{ createClient }, { createSupabaseAuthClient }] = await Promise.all([
        import("@supabase/supabase-js"),
        import("./supabaseAuthClient"),
      ]);
      return createSupabaseAuthClient(createClient(url, anonKey).auth);
    });
  }
  return notConnectedAuthClient;
}

export const authClient: AuthClient = pickAuthClient();
