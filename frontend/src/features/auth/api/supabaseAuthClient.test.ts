import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "../types";
import { createSupabaseAuthClient, toAuthError, toAuthUser, type SupabaseAuthApi } from "./supabaseAuthClient";

/** The Supabase client, mocked: every call is a vi.fn and answers what each test sets. */
function mockAuth() {
  const unsubscribe = vi.fn();
  let emit: (event: string, session: unknown) => void = () => undefined;
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resend: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
      emit = callback;
      return { data: { subscription: { id: "s1", callback, unsubscribe } } };
    }),
  };
  return { auth, unsubscribe, emit: (event: string, session: unknown) => emit(event, session) };
}

const SITE = "https://lootbook.test";
const user = (over: Record<string, unknown> = {}) => ({
  id: "u1",
  email: "lucien@example.com",
  user_metadata: {},
  identities: [{ id: "i1" }],
  ...over,
});
const session = (over: Record<string, unknown> = {}) => ({ access_token: "token-1", user: user(), ...over });
const apiError = (code: string, status = 400, message = code) => new AuthApiError(message, status, code);

let mock: ReturnType<typeof mockAuth>;
let pageUrl = `${SITE}/set-new-password`;
const client = () =>
  createSupabaseAuthClient(mock.auth as unknown as SupabaseAuthApi, { siteUrl: () => SITE, pageUrl: () => pageUrl });

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (caught) {
    return caught as AuthError;
  }
  throw new Error("expected a rejection");
}

beforeEach(() => {
  mock = mockAuth();
  pageUrl = `${SITE}/set-new-password`;
});

describe("toAuthError", () => {
  it.each([
    ["invalid_credentials", "wrong-password"],
    ["user_not_found", "no-account"],
    ["email_exists", "email-taken"],
    ["user_already_exists", "email-taken"],
    ["otp_expired", "link-expired"],
    ["flow_state_expired", "link-expired"],
    ["flow_state_not_found", "link-expired"],
    ["over_email_send_rate_limit", "unknown"],
    ["weak_password", "unknown"],
    ["email_not_confirmed", "unknown"],
  ])("maps %s to %s", (code, expected) => {
    const mapped = toAuthError(apiError(code));
    expect(mapped).toBeInstanceOf(AuthError);
    expect(mapped.code).toBe(expected);
  });

  it("maps a failed fetch to network", () => {
    expect(toAuthError(new AuthRetryableFetchError("Failed to fetch", 0)).code).toBe("network");
    expect(toAuthError(new TypeError("Failed to fetch")).code).toBe("network");
  });

  it("maps a missing session to link-expired", () => {
    expect(toAuthError(new AuthSessionMissingError()).code).toBe("link-expired");
  });

  it("maps an existing email answered without a code", () => {
    expect(toAuthError(new AuthApiError("User already registered", 422, undefined)).code).toBe("email-taken");
  });

  it("keeps an AuthError as it is and maps anything else to unknown", () => {
    const own = new AuthError("network");
    expect(toAuthError(own)).toBe(own);
    expect(toAuthError("boom").code).toBe("unknown");
    expect(toAuthError(new Error("boom")).message).toBe("boom");
  });
});

describe("toAuthUser", () => {
  it("uses the full name and the avatar from the provider", () => {
    const mapped = toAuthUser(user({ user_metadata: { full_name: " Lucien Vale ", avatar_url: "https://a/p.png" } }) as never);
    expect(mapped).toEqual({ id: "u1", email: "lucien@example.com", displayName: "Lucien Vale", avatarUrl: "https://a/p.png" });
  });

  it("falls back to name, picture, then the email", () => {
    expect(toAuthUser(user({ user_metadata: { name: "Wren", picture: "https://a/w.png" } }) as never)).toMatchObject({
      displayName: "Wren",
      avatarUrl: "https://a/w.png",
    });
    expect(toAuthUser(user() as never)).toMatchObject({ displayName: "Lucien", avatarUrl: null });
    expect(toAuthUser(user({ email: undefined }) as never)).toMatchObject({ email: "", displayName: "Player" });
  });
});

describe("createSupabaseAuthClient", () => {
  it("signIn: signs in with the password and returns the user", async () => {
    mock.auth.signInWithPassword.mockResolvedValue({ data: { user: user(), session: session() }, error: null });
    await expect(client().signIn("lucien@example.com", "pw")).resolves.toMatchObject({ id: "u1", displayName: "Lucien" });
    expect(mock.auth.signInWithPassword).toHaveBeenCalledWith({ email: "lucien@example.com", password: "pw" });
  });

  it("signIn: a wrong password, a network failure and a thrown error", async () => {
    mock.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: apiError("invalid_credentials") });
    expect((await rejection(client().signIn("a@b.c", "x"))).code).toBe("wrong-password");
    mock.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthRetryableFetchError("Failed to fetch", 0) });
    expect((await rejection(client().signIn("a@b.c", "x"))).code).toBe("network");
    mock.auth.signInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
    expect((await rejection(client().signIn("a@b.c", "x"))).code).toBe("network");
  });

  it("signUp: sends the confirmation back to the site", async () => {
    mock.auth.signUp.mockResolvedValue({ data: { user: user(), session: null }, error: null });
    await expect(client().signUp("new@example.com", "pw")).resolves.toBeUndefined();
    expect(mock.auth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "pw",
      options: { emailRedirectTo: `${SITE}/` },
    });
  });

  it("signUp: an email with an account, as an error or as a user with no identities", async () => {
    mock.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: apiError("email_exists", 422) });
    expect((await rejection(client().signUp("a@b.c", "pw"))).code).toBe("email-taken");
    mock.auth.signUp.mockResolvedValue({ data: { user: user({ identities: [] }), session: null }, error: null });
    expect((await rejection(client().signUp("a@b.c", "pw"))).code).toBe("email-taken");
  });

  it("resendConfirmation: resends the signup email", async () => {
    mock.auth.resend.mockResolvedValue({ data: {}, error: null });
    await client().resendConfirmation("new@example.com");
    expect(mock.auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "new@example.com",
      options: { emailRedirectTo: `${SITE}/` },
    });
    mock.auth.resend.mockResolvedValue({ data: {}, error: apiError("over_email_send_rate_limit", 429) });
    expect((await rejection(client().resendConfirmation("a@b.c"))).code).toBe("unknown");
  });

  it("signInWithProvider: leaves for the provider and returns null", async () => {
    mock.auth.signInWithOAuth.mockResolvedValue({ data: { provider: "google", url: "https://x" }, error: null });
    await expect(client().signInWithProvider("google")).resolves.toBeNull();
    expect(mock.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: `${SITE}/` } });
    mock.auth.signInWithOAuth.mockResolvedValue({ data: { provider: "apple", url: null }, error: new AuthRetryableFetchError("x", 0) });
    expect((await rejection(client().signInWithProvider("apple"))).code).toBe("network");
  });

  it("resetPassword: the link opens set a new password", async () => {
    mock.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await client().resetPassword("lucien@example.com");
    expect(mock.auth.resetPasswordForEmail).toHaveBeenCalledWith("lucien@example.com", {
      redirectTo: `${SITE}/set-new-password`,
    });
    mock.auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: apiError("over_email_send_rate_limit", 429) });
    expect((await rejection(client().resetPassword("a@b.c"))).code).toBe("unknown");
  });

  it("checkResetLink: valid with the recovery session, expired without it or with an error in the address", async () => {
    mock.auth.getSession.mockResolvedValue({ data: { session: session() }, error: null });
    await expect(client().checkResetLink()).resolves.toBe("valid");
    pageUrl = `${SITE}/set-new-password#error=access_denied&error_code=otp_expired`;
    await expect(client().checkResetLink()).resolves.toBe("expired");
    pageUrl = `${SITE}/set-new-password?error=access_denied`;
    await expect(client().checkResetLink()).resolves.toBe("expired");
    pageUrl = `${SITE}/set-new-password`;
    mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(client().checkResetLink()).resolves.toBe("expired");
    mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: new AuthRetryableFetchError("x", 0) });
    await expect(client().checkResetLink()).resolves.toBe("expired");
  });

  it("setNewPassword: updates the password and ends signed in", async () => {
    mock.auth.updateUser.mockResolvedValue({ data: { user: user() }, error: null });
    await expect(client().setNewPassword("new-pw")).resolves.toMatchObject({ id: "u1" });
    expect(mock.auth.updateUser).toHaveBeenCalledWith({ password: "new-pw" });
  });

  it("setNewPassword: no recovery session is an expired link; other errors are unknown", async () => {
    mock.auth.updateUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });
    expect((await rejection(client().setNewPassword("x"))).code).toBe("link-expired");
    mock.auth.updateUser.mockResolvedValue({ data: { user: null }, error: apiError("same_password", 422) });
    expect((await rejection(client().setNewPassword("x"))).code).toBe("unknown");
  });

  it("signOut: this device only, and never fails", async () => {
    mock.auth.signOut.mockResolvedValue({ error: null });
    await client().signOut();
    expect(mock.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    mock.auth.signOut.mockResolvedValue({ error: new AuthRetryableFetchError("x", 0) });
    await expect(client().signOut()).resolves.toBeUndefined();
    mock.auth.signOut.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(client().signOut()).resolves.toBeUndefined();
  });

  it("currentUser and getAccessToken: from the session, null without one or on an error", async () => {
    mock.auth.getSession.mockResolvedValue({ data: { session: session() }, error: null });
    await expect(client().currentUser()).resolves.toMatchObject({ id: "u1" });
    await expect(client().getAccessToken()).resolves.toBe("token-1");
    mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(client().currentUser()).resolves.toBeNull();
    await expect(client().getAccessToken()).resolves.toBeNull();
    mock.auth.getSession.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(client().currentUser()).resolves.toBeNull();
    await expect(client().getAccessToken()).resolves.toBeNull();
  });

  it("onChange: hears sign-in and sign-out, not a refreshed token, and unsubscribes", () => {
    const listener = vi.fn();
    const stop = client().onChange(listener);
    mock.emit("SIGNED_IN", session());
    mock.emit("TOKEN_REFRESHED", session());
    mock.emit("SIGNED_OUT", null);
    expect(listener.mock.calls).toEqual([[expect.objectContaining({ id: "u1" })], [null]]);
    stop();
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
  });
});
