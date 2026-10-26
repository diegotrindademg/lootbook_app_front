import { afterEach, describe, expect, it, vi } from "vitest";

/** Which sign-in client the app picks, with supabase-js mocked: no project, no keys, no network. */
const createClient = vi.fn(() => ({
  auth: { getSession: vi.fn(async () => ({ data: { session: null }, error: null })), onAuthStateChange: vi.fn() },
}));
vi.mock("@supabase/supabase-js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@supabase/supabase-js")>()),
  createClient,
}));

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  createClient.mockClear();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  return (await import("./authClient")).authClient;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authClient", () => {
  it("is the Supabase client when both variables are set, loaded on the first call", async () => {
    const client = await load({
      NEXT_PUBLIC_LOOTBOOK_FAKE: "",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(createClient).not.toHaveBeenCalled();
    await expect(client.currentUser()).resolves.toBeNull();
    await client.getAccessToken();
    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith("https://project.supabase.test", "anon");
  });

  it("is not connected when a variable is missing", async () => {
    const client = await load({
      NEXT_PUBLIC_LOOTBOOK_FAKE: "",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });
    expect(createClient).not.toHaveBeenCalled();
    await expect(client.signIn("a@b.c", "pw")).rejects.toMatchObject({ code: "not-connected" });
  });

  it("is the fake in development with NEXT_PUBLIC_LOOTBOOK_FAKE=1, even with Supabase set", async () => {
    const client = await load({
      NODE_ENV: "development",
      NEXT_PUBLIC_LOOTBOOK_FAKE: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(createClient).not.toHaveBeenCalled();
    const { fakeAuthClient } = await import("./fakeAuthClient");
    expect(client).toBe(fakeAuthClient);
  });
});
