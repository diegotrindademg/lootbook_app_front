import type { AuthClient } from "./authClient";

/**
 * An AuthClient whose real client loads later, so a library is only downloaded when it is used
 * (authClient.ts loads supabase-js this way). Every call waits for it; a listener added before it is
 * ready is attached once it is, unless it was removed first.
 */
export function deferredAuthClient(load: () => Promise<AuthClient>): AuthClient {
  let loading: Promise<AuthClient> | null = null;
  const ready = () => (loading ??= load());

  return {
    signIn: (email, password) => ready().then((client) => client.signIn(email, password)),
    signUp: (email, password) => ready().then((client) => client.signUp(email, password)),
    resendConfirmation: (email) => ready().then((client) => client.resendConfirmation(email)),
    signInWithProvider: (provider) => ready().then((client) => client.signInWithProvider(provider)),
    resetPassword: (email) => ready().then((client) => client.resetPassword(email)),
    checkResetLink: () => ready().then((client) => client.checkResetLink()),
    setNewPassword: (password) => ready().then((client) => client.setNewPassword(password)),
    signOut: () => ready().then((client) => client.signOut()),
    currentUser: () => ready().then((client) => client.currentUser()),
    getAccessToken: () => ready().then((client) => client.getAccessToken()),
    onChange(listener) {
      let stop: (() => void) | null = null;
      let removed = false;
      ready().then((client) => {
        if (!removed) stop = client.onChange(listener);
      });
      return () => {
        removed = true;
        stop?.();
      };
    },
  };
}
