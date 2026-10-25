"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import type { AuthProvider } from "../types";
import { REASSURANCE, authNotices, isAuthError, looksLikeEmail, type AuthNotice } from "../utils/authNotices";
import AuthField from "./AuthField";
import AuthProviderButtons from "./AuthProviderButtons";
import AuthScreen, { AuthFields, AuthForm, AuthRow, Strong, TextButton } from "./AuthScreen";

/** 05.1 Sign in, with its errors 05.6 and 05.7 and the submitting state 05.9. */
export default function SignInView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);
  const draft = flow.draftName;

  const submit = async () => {
    const email = flow.email.trim();
    if (!email || !password) return setError(authNotices.missing(email ? "password" : "email"));
    if (!looksLikeEmail(email)) return setError(authNotices.invalidEmail());

    setError(null);
    setSubmitting(true);
    try {
      await authClient.signIn(email, password);
      flow.exit();
    } catch (caught) {
      setSubmitting(false);
      if (isAuthError(caught, "wrong-password")) {
        setError(authNotices.wrongPassword(() => router.push("/reset-password")));
      } else if (isAuthError(caught, "no-account")) {
        setError(authNotices.noAccount(Boolean(draft), () => router.push("/create-account")));
      } else {
        setError(authNotices.failed(caught));
      }
    }
  };

  const continueWith = async (provider: AuthProvider) => {
    setError(null);
    setSubmitting(true);
    try {
      // A real provider may leave the page here and come back signed in.
      const user = await authClient.signInWithProvider(provider);
      if (user) flow.exit();
    } catch (caught) {
      setSubmitting(false);
      setError(authNotices.failed(caught));
    }
  };

  return (
    <AuthScreen
      title={draft ? "Save your character" : "Sign in"}
      subtitle={
        draft ? (
          <>
            Sign in so <Strong>{draft}</Strong> outlives this session.
          </>
        ) : (
          "Your characters are waiting."
        )
      }
      reassurance={draft ? REASSURANCE : null}
      error={error}
      backLabel={draft ? "Back to draft" : "Back"}
      onBack={flow.exit}
    >
      <AuthProviderButtons disabled={submitting} onSelect={continueWith} />
      <AuthForm onSubmit={submit}>
        <AuthFields>
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            value={flow.email}
            onChange={flow.setEmail}
            invalid={error?.field === "email"}
            disabled={submitting}
          />
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            invalid={error?.field === "password"}
            disabled={submitting}
          />
        </AuthFields>
        <AuthRow end>
          <TextButton onClick={() => router.push("/reset-password")} disabled={submitting}>
            Forgot password?
          </TextButton>
        </AuthRow>
        <PillButton type="submit" busy={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </PillButton>
        <PillButton variant="flat" disabled={submitting} onClick={() => router.push("/create-account")}>
          Create account
        </PillButton>
      </AuthForm>
    </AuthScreen>
  );
}
