"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAccessTokenProvider } from "@/shared/api/lootbookRequest";
import { authClient } from "../api/authClient";
import type { AuthUser } from "../types";

type AuthSession = {
  /** "checking" until the first read of the current user finishes. */
  status: "checking" | "signed-in" | "signed-out";
  user: AuthUser | null;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSession | null>(null);

setAccessTokenProvider(() => authClient.getAccessToken());

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    // A sign-in service that cannot be reached reads as signed out, so the nav bar offers Sign in
    // instead of waiting forever.
    authClient
      .currentUser()
      .catch(() => null)
      .then((current) => {
        if (!active) return;
        setUser(current);
        setChecked(true);
      });
    const unsubscribe = authClient.onChange((next) => {
      setUser(next);
      setChecked(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthSession>(
    () => ({
      status: !checked ? "checking" : user ? "signed-in" : "signed-out",
      user,
      signOut: () => authClient.signOut(),
    }),
    [checked, user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return session;
}
