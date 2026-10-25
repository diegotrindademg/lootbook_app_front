import { DEV_FAKES_ENABLED } from "@/shared/config/devFakes";
import { AuthError, type AuthChangeListener, type AuthProvider, type AuthUser } from "../types";
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
  /** Called from the page the reset link opens; ends signed in. */
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
 * TODO(Kerley): the Supabase version of AuthClient goes here (supabase-js `auth.signInWithPassword`,
 * `signUp`, `resend`, `signInWithOAuth`, `resetPasswordForEmail`, `updateUser`, `signOut`,
 * `getSession`, `onAuthStateChange`). Until then every call fails with "not-connected", the list is
 * read without a token (a development back end answers as its guest user), and the screens still render.
 */
const notConnectedAuthClient: AuthClient = {
  signIn: notConnected,
  signUp: notConnected,
  resendConfirmation: notConnected,
  signInWithProvider: notConnected,
  resetPassword: notConnected,
  setNewPassword: notConnected,
  signOut: async () => undefined,
  currentUser: async () => null,
  getAccessToken: async () => null,
  onChange: () => () => undefined,
};

export const authClient: AuthClient = DEV_FAKES_ENABLED ? fakeAuthClient : notConnectedAuthClient;
