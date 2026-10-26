import { describe, expect, it, vi } from "vitest";
import type { AuthClient } from "./authClient";
import { deferredAuthClient } from "./deferredAuthClient";

function realClient() {
  const unsubscribe = vi.fn();
  const client = {
    signIn: vi.fn(async () => ({ id: "u1", email: "a@b.c", displayName: "A", avatarUrl: null })),
    signUp: vi.fn(async () => undefined),
    resendConfirmation: vi.fn(async () => undefined),
    signInWithProvider: vi.fn(async () => null),
    resetPassword: vi.fn(async () => undefined),
    checkResetLink: vi.fn(async () => "valid" as const),
    setNewPassword: vi.fn(async () => ({ id: "u1", email: "a@b.c", displayName: "A", avatarUrl: null })),
    signOut: vi.fn(async () => undefined),
    currentUser: vi.fn(async () => null),
    getAccessToken: vi.fn(async () => "token"),
    onChange: vi.fn(() => unsubscribe),
  } satisfies AuthClient;
  return { client, unsubscribe };
}

describe("deferredAuthClient", () => {
  it("loads once, on the first call, and passes every call through", async () => {
    const { client } = realClient();
    const load = vi.fn(async () => client);
    const deferred = deferredAuthClient(load);
    expect(load).not.toHaveBeenCalled();
    await deferred.signIn("a@b.c", "pw");
    await deferred.signUp("a@b.c", "pw");
    await deferred.resendConfirmation("a@b.c");
    await deferred.signInWithProvider("apple");
    await deferred.resetPassword("a@b.c");
    await expect(deferred.checkResetLink()).resolves.toBe("valid");
    await deferred.setNewPassword("pw2");
    await deferred.signOut();
    await deferred.currentUser();
    await expect(deferred.getAccessToken()).resolves.toBe("token");
    expect(load).toHaveBeenCalledOnce();
    expect(client.signIn).toHaveBeenCalledWith("a@b.c", "pw");
    expect(client.signInWithProvider).toHaveBeenCalledWith("apple");
    expect(client.setNewPassword).toHaveBeenCalledWith("pw2");
  });

  it("passes the real client's rejection through", async () => {
    const { client } = realClient();
    client.signIn.mockRejectedValueOnce(new Error("wrong"));
    await expect(deferredAuthClient(async () => client).signIn("a", "b")).rejects.toThrow("wrong");
  });

  it("attaches a listener once loaded, and not at all when removed first", async () => {
    const { client, unsubscribe } = realClient();
    const listener = vi.fn();
    const kept = deferredAuthClient(async () => client);
    const stop = kept.onChange(listener);
    await kept.currentUser();
    expect(client.onChange).toHaveBeenCalledWith(listener);
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();

    const other = realClient();
    const early = deferredAuthClient(async () => other.client);
    early.onChange(listener)();
    await early.currentUser();
    expect(other.client.onChange).not.toHaveBeenCalled();
  });
});
