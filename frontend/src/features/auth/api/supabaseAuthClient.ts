import { isAuthApiError, isAuthError, isAuthRetryableFetchError, isAuthSessionMissingError } from "@supabase/supabase-js";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { AuthError, type AuthErrorCode, type AuthUser } from "../types";
import type { AuthClient } from "./authClient";

/**
 * DRAFT, needs Kerley's OK before it is used for real (docs/FRONTEND_V1.md, "Sign-in with Supabase").
 *
 * AuthClient on Supabase Auth (supabase-js v2). Written and tested against a mocked client only: no
 * project, no keys, no network. `authClient.ts` picks it when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are both set.
 *
 * What the Supabase project needs, Kerley's side: email and password sign-in with "Confirm email" on,
 * the Google and Apple providers, and these redirect URLs allowed: `<site>/` (confirmation and the
 * providers) and `<site>/set-new-password` (the reset link).
 */

/** Only the part of the Supabase client this file uses, so the tests can hand in a mock. */
export type SupabaseAuthApi = Pick<SupabaseClient["auth"],
  | "signInWithPassword"
  | "signUp"
  | "resend"
  | "signInWithOAuth"
  | "resetPasswordForEmail"
  | "updateUser"
  | "signOut"
  | "getSession"
  | "onAuthStateChange"
>;

export type SupabaseAuthOptions = {
  /** Where the emails and providers send the user back, e.g. "https://lootbook.app". Default: this page's origin. */
  siteUrl?: () => string;
  /** The address the page was opened at, read by checkResetLink. Default: window.location.href. */
  pageUrl?: () => string;
};

/** Supabase's error codes (auth-js `ErrorCode`) mapped to the failures the screens know how to show. */
const CODE_MAP: Record<string, AuthErrorCode> = {
  invalid_credentials: "wrong-password",
  user_not_found: "no-account",
  email_exists: "email-taken",
  user_already_exists: "email-taken",
  otp_expired: "link-expired",
  flow_state_expired: "link-expired",
  flow_state_not_found: "link-expired",
};

/** Any error from supabase-js (or a thrown fetch failure) as the AuthError the screens read. */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (isAuthRetryableFetchError(error)) return new AuthError("network", message);
  if (error instanceof TypeError) return new AuthError("network", message);
  if (isAuthSessionMissingError(error)) return new AuthError("link-expired", message);
  if (isAuthError(error) || isAuthApiError(error)) {
    const mapped = error.code ? CODE_MAP[error.code] : undefined;
    if (mapped) return new AuthError(mapped, message);
    // Older Supabase servers answer an existing email with this message and no code.
    if (error.message === "User already registered") return new AuthError("email-taken", message);
  }
  return new AuthError("unknown", message);
}

/** The Supabase user as the screens see it. The name falls back to the email, as in the fake. */
export function toAuthUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";
  const local = email.split("@")[0] || "player";
  const named = [meta.full_name, meta.name].find((value) => typeof value === "string" && value.trim());
  const avatar = [meta.avatar_url, meta.picture].find((value) => typeof value === "string" && value);
  return {
    id: user.id,
    email,
    displayName: (named as string | undefined)?.trim() ?? local.charAt(0).toUpperCase() + local.slice(1),
    avatarUrl: (avatar as string | undefined) ?? null,
  };
}

/** Throws the mapped AuthError when a supabase-js call answered with one. */
function check(error: unknown) {
  if (error) throw toAuthError(error);
}

/** Supabase puts a failed email link's reason in the address: `#error_code=otp_expired&...` or `?error=...`. */
function linkFailed(href: string) {
  try {
    const url = new URL(href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    return ["error", "error_code"].some((key) => url.searchParams.has(key) || hash.has(key));
  } catch {
    return false;
  }
}

export function createSupabaseAuthClient(auth: SupabaseAuthApi, options: SupabaseAuthOptions = {}): AuthClient {
  const siteUrl = options.siteUrl ?? (() => window.location.origin);
  const pageUrl = options.pageUrl ?? (() => window.location.href);
  const session = async (): Promise<Session | null> => {
    const { data, error } = await auth.getSession();
    check(error);
    return data.session;
  };

  return {
    async signIn(email, password) {
      // Supabase answers a wrong password and an unknown email with the same invalid_credentials,
      // so "No account for that email" never shows with this client (FRONTEND_V1.md).
      try {
        const { data, error } = await auth.signInWithPassword({ email, password });
        check(error);
        return toAuthUser(data.user!);
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async signUp(email, password) {
      try {
        const { data, error } = await auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${siteUrl()}/` },
        });
        check(error);
        // With "Confirm email" on, an email that already has an account comes back as a user with no
        // identities instead of an error (auth-js signUp notes).
        if (data.user && data.user.identities?.length === 0) throw new AuthError("email-taken");
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async resendConfirmation(email) {
      try {
        const { error } = await auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${siteUrl()}/` },
        });
        check(error);
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async signInWithProvider(provider) {
      // The browser leaves for Google or Apple and comes back to the site signed in, so nothing to return.
      try {
        const { error } = await auth.signInWithOAuth({ provider, options: { redirectTo: `${siteUrl()}/` } });
        check(error);
        return null;
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async resetPassword(email) {
      // Supabase answers the same whether or not the email has an account, as the screen needs.
      try {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/set-new-password` });
        check(error);
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async checkResetLink() {
      // The client reads the recovery session from the reset link's address as it starts; getSession
      // waits for that. A failed link carries its error in the address instead.
      if (linkFailed(pageUrl())) return "expired";
      try {
        return (await session()) ? "valid" : "expired";
      } catch {
        return "expired";
      }
    },

    async setNewPassword(password) {
      try {
        const { data, error } = await auth.updateUser({ password });
        check(error);
        return toAuthUser(data.user!);
      } catch (caught) {
        throw toAuthError(caught);
      }
    },

    async signOut() {
      // This device only, like the fake. supabase-js forgets the session here even when the server
      // cannot be reached, so an error is not shown.
      await auth.signOut({ scope: "local" }).catch(() => undefined);
    },

    async currentUser() {
      try {
        const current = await session();
        return current ? toAuthUser(current.user) : null;
      } catch {
        return null;
      }
    },

    async getAccessToken() {
      try {
        return (await session())?.access_token ?? null;
      } catch {
        return null;
      }
    },

    onChange(listener) {
      const { data } = auth.onAuthStateChange((event, next) => {
        // A refreshed token is the same user; the screens need not hear about it.
        if (event === "TOKEN_REFRESHED") return;
        listener(next ? toAuthUser(next.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
