import { AuthError, type AuthChangeListener } from "../types";
import type { AuthClient } from "./authClient";

/**
 * An AuthClient whose real client loads later, so a library is only downloaded when it is used
 * (authClient.ts loads supabase-js this way). Every call waits for it. A load that fails is not kept:
 * that call fails as "network" and the next call tries again. A listener added before the client is
 * there is attached once a load works, unless it was removed first.
 */
export function deferredAuthClient(load: () => Promise<AuthClient>): AuthClient {
  let loading: Promise<AuthClient> | null = null;
  let loaded: AuthClient | null = null;
  const waiting = new Set<{ listener: AuthChangeListener; stop: (() => void) | null }>();

  const ready = () =>
    (loading ??= load().then(
      (client) => {
        loaded = client;
        for (const entry of waiting) entry.stop = client.onChange(entry.listener);
        waiting.clear();
        return client;
      },
      (error: unknown) => {
        loading = null;
        throw new AuthError("network", error instanceof Error ? error.message : String(error));
      },
    ));

  return {
    signIn: (email, password) => ready().then((client) => client.signIn(email, password)),
    signUp: (email, password) => ready().then((client) => client.signUp(email, password)),
    resendConfirmation: (email) => ready().then((client) => client.resendConfirmation(email)),
    signInWithProvider: (provider) => ready().then((client) => client.signInWithProvider(provider)),
    resetPassword: (email) => ready().then((client) => client.resetPassword(email)),
    checkResetLink: () => ready().then((client) => client.checkResetLink()),
    setNewPassword: (password) => ready().then((client) => client.setNewPassword(password)),
    signOut: () => ready().then((client) => client.signOut()),
    // Like the Supabase client itself: no user and no token while the service cannot be reached.
    currentUser: () => ready().then((client) => client.currentUser(), () => null),
    getAccessToken: () => ready().then((client) => client.getAccessToken(), () => null),
    onChange(listener) {
      const entry = { listener, stop: null as (() => void) | null };
      if (loaded) entry.stop = loaded.onChange(listener);
      else {
        waiting.add(entry);
        ready().catch(() => undefined);
      }
      return () => {
        waiting.delete(entry);
        entry.stop?.();
      };
    },
  };
}
