"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RESUME_NEW_DRAFT_PATH, readNewDraftName } from "@/features/sheet/utils/deviceDraft";

/**
 * What the sign-in screens share while the user moves between them: the email (carried from one
 * screen to the next), the create-account fields (kept when Back leaves Check your email), and
 * where to go when the flow ends. The return place and the email are kept in localStorage, because
 * the reset link opens the app again in a new tab and the user must still land where they started.
 */
type AuthFlow = {
  email: string;
  setEmail: (email: string) => void;
  createPassword: string;
  setCreatePassword: (value: string) => void;
  createConfirm: string;
  setCreateConfirm: (value: string) => void;
  clearCreateFields: () => void;
  /** The character waiting to be saved, when sign-in was reached from Save. */
  draftName: string | null;
  /** Leaves the flow: back to where the user came from, or "/" when there is no such place. */
  exit: () => void;
};

const STORAGE_KEY = "lootbook.authFlow";

const AuthFlowContext = createContext<AuthFlow | null>(null);

/** Only paths inside the app; anything else falls back to "/". */
function safeReturnTo(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function readStored(): { returnTo: string | null; email: string } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { returnTo?: string; email?: string }) : {};
    return { returnTo: safeReturnTo(parsed.returnTo), email: parsed.email ?? "" };
  } catch {
    return { returnTo: null, email: "" };
  }
}

function writeStored(value: { returnTo: string | null; email: string } | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the flow still works inside this tab.
  }
}

export function AuthFlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirm, setCreateConfirm] = useState("");
  const [draftName, setDraftName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stored = readStored();
    const back = safeReturnTo(params.get("returnTo")) ?? stored.returnTo;
    setReturnTo(back);
    setEmail((current) => current || stored.email);
    // Reached from Save in the editor: the draft kept on this device (plan C5) gives its name.
    setDraftName(back === RESUME_NEW_DRAFT_PATH ? readNewDraftName() : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeStored({ returnTo, email });
  }, [loaded, returnTo, email]);

  const clearCreateFields = useCallback(() => {
    setEmail("");
    setCreatePassword("");
    setCreateConfirm("");
  }, []);

  const exit = useCallback(() => {
    writeStored(null);
    router.replace(returnTo ?? "/");
  }, [returnTo, router]);

  const value = useMemo<AuthFlow>(
    () => ({
      email,
      setEmail,
      createPassword,
      setCreatePassword,
      createConfirm,
      setCreateConfirm,
      clearCreateFields,
      draftName,
      exit,
    }),
    [email, createPassword, createConfirm, clearCreateFields, draftName, exit],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const flow = useContext(AuthFlowContext);
  if (!flow) throw new Error("useAuthFlow must be used inside AuthFlowProvider");
  return flow;
}
