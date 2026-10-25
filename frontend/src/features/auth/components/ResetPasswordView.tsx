"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import { authNotices, looksLikeEmail, type AuthNotice } from "../utils/authNotices";
import AuthField from "./AuthField";
import AuthScreen, { AuthForm, AuthRow, TextButton } from "./AuthScreen";

/** 05.4 Reset your password: the email, then the link. */
export default function ResetPasswordView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);

  const submit = async () => {
    const email = flow.email.trim();
    if (!email) return setError(authNotices.missing("email"));
    if (!looksLikeEmail(email)) return setError(authNotices.invalidEmail());

    setError(null);
    setSubmitting(true);
    try {
      await authClient.resetPassword(email);
      router.push("/reset-link-sent");
    } catch (caught) {
      setSubmitting(false);
      setError(authNotices.failed(caught));
    }
  };

  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Tell us the email on your account and we will send a link to set a new password."
      error={error}
      backLabel="Back"
      onBack={flow.exit}
    >
      <AuthForm onSubmit={submit}>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={flow.email}
          onChange={flow.setEmail}
          invalid={error?.field === "email"}
          disabled={submitting}
        />
        <PillButton type="submit" busy={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </PillButton>
        <AuthRow>
          <TextButton tone="muted" onClick={() => router.push("/sign-in")} disabled={submitting}>
            Back to sign in
          </TextButton>
        </AuthRow>
      </AuthForm>
    </AuthScreen>
  );
}
