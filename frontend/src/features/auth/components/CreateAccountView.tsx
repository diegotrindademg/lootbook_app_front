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
import AuthScreen, { AuthFields, AuthForm, AuthRow, AuthRowText, Strong, TextButton } from "./AuthScreen";

/** 05.2 Create your account, with its error 05.8 and the submitting state. */
export default function CreateAccountView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);
  const draft = flow.draftName;

  const submit = async () => {
    const email = flow.email.trim();
    if (!email) return setError(authNotices.missing("email"));
    if (!looksLikeEmail(email)) return setError(authNotices.invalidEmail());
    if (!flow.createPassword) return setError(authNotices.missing("password"));
    if (flow.createPassword !== flow.createConfirm) return setError(authNotices.mismatch());

    setError(null);
    setSubmitting(true);
    try {
      await authClient.signUp(email, flow.createPassword);
      router.push("/check-email");
    } catch (caught) {
      setSubmitting(false);
      setError(
        isAuthError(caught, "email-taken")
          ? authNotices.emailTaken(Boolean(draft), () => router.push("/sign-in"))
          : authNotices.failed(caught, { onRetry: submit, doing: "create-account" }),
      );
    }
  };

  const continueWith = async (provider: AuthProvider) => {
    setError(null);
    setSubmitting(true);
    try {
      const user = await authClient.signInWithProvider(provider);
      if (user) flow.exit();
    } catch (caught) {
      setSubmitting(false);
      setError(authNotices.failed(caught));
    }
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle={
        draft ? (
          <>
            One account keeps <Strong>{draft}</Strong> and everything after it.
          </>
        ) : (
          "One account, every character you make."
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
            autoComplete="new-password"
            value={flow.createPassword}
            onChange={flow.setCreatePassword}
            invalid={error?.field === "password"}
            disabled={submitting}
          />
          <AuthField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={flow.createConfirm}
            onChange={flow.setCreateConfirm}
            invalid={error?.field === "confirm"}
            disabled={submitting}
          />
        </AuthFields>
        <PillButton type="submit" busy={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </PillButton>
        <AuthRow>
          <AuthRowText>Already have an account?</AuthRowText>
          <TextButton onClick={() => router.push("/sign-in")} disabled={submitting}>
            Sign in
          </TextButton>
        </AuthRow>
      </AuthForm>
    </AuthScreen>
  );
}
