"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import { authNotices, isAuthError, type AuthNotice } from "../utils/authNotices";
import { announceOnArrival } from "../utils/arrivalNotice";
import AuthField from "./AuthField";
import AuthScreen, { AuthFields, AuthForm, AuthRow, TextButton } from "./AuthScreen";

/**
 * The page the reset link opens (plan M0, A4; Figma 2372:2150). Saving ends signed in, back where the
 * user started (or "/"), with a "Password changed" notice there. A link that no longer works shows
 * the expired state (Figma 2372:2469) with a way to send a new one.
 */
export default function SetNewPasswordView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [link, setLink] = useState<"checking" | "valid" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);

  useEffect(() => {
    let active = true;
    authClient.checkResetLink().then((state) => {
      if (active) setLink(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (!password) return setError(authNotices.missing("password"));
    if (password !== confirm) return setError(authNotices.mismatch());

    setError(null);
    setSubmitting(true);
    try {
      await authClient.setNewPassword(password);
      announceOnArrival("password-changed");
      flow.exit();
    } catch (caught) {
      setSubmitting(false);
      if (isAuthError(caught, "link-expired")) setLink("expired");
      else setError(authNotices.failed(caught));
    }
  };

  const sendNewLink = async () => {
    const email = flow.email.trim();
    if (!email) {
      router.push("/reset-password");
      return;
    }
    setSubmitting(true);
    try {
      await authClient.resetPassword(email);
      router.push("/reset-link-sent");
    } catch (caught) {
      setSubmitting(false);
      setError(authNotices.failed(caught));
    }
  };

  const expired = link === "expired";

  return (
    <AuthScreen
      title="Set a new password"
      subtitle="Choose a new password for your account."
      error={expired ? (error ?? authNotices.linkExpired()) : error}
      backLabel="Back"
      onBack={flow.exit}
    >
      {link === "valid" && (
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
      )}
      {expired && (
        <>
          <PillButton busy={submitting} onClick={sendNewLink}>
            {submitting ? "Sending…" : "Send a new link"}
          </PillButton>
          <AuthRow>
            <TextButton tone="muted" onClick={() => router.push("/sign-in")} disabled={submitting}>
              Back to sign in
            </TextButton>
          </AuthRow>
        </>
      )}
    </AuthScreen>
  );
}
