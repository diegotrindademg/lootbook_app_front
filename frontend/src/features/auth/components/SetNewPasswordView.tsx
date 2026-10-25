"use client";

import { useState } from "react";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import { authNotices, type AuthNotice } from "../utils/authNotices";
import AuthField from "./AuthField";
import AuthScreen, { AuthFields, AuthForm } from "./AuthScreen";

/**
 * The page the reset link opens (plan M0, A4). Not drawn in the design: built on the same frame as
 * the other sign-in screens. Saving ends signed in, back where the user started (or "/").
 * TODO(Kerley): the real client reads the reset token from the link before setNewPassword.
 */
export default function SetNewPasswordView() {
  const flow = useAuthFlow();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);

  const submit = async () => {
    if (!password) return setError(authNotices.missing("password"));
    if (password !== confirm) return setError(authNotices.mismatch());

    setError(null);
    setSubmitting(true);
    try {
      await authClient.setNewPassword(password);
      flow.exit();
    } catch (caught) {
      setSubmitting(false);
      setError(authNotices.failed(caught));
    }
  };

  return (
    <AuthScreen
      title="Set a new password"
      subtitle="Choose a new password for your account."
      error={error}
      backLabel="Back"
      onBack={flow.exit}
    >
      <AuthForm onSubmit={submit}>
        <AuthFields>
          <AuthField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            invalid={error?.field === "password"}
            disabled={submitting}
          />
          <AuthField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            invalid={error?.field === "confirm"}
            disabled={submitting}
          />
        </AuthFields>
        <PillButton type="submit" busy={submitting}>
          {submitting ? "Saving…" : "Save password"}
        </PillButton>
      </AuthForm>
    </AuthScreen>
  );
}
