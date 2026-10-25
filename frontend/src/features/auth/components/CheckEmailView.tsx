"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import { authNotices, type AuthNotice } from "../utils/authNotices";
import AuthScreen, { AuthRow, Strong, TextButton } from "./AuthScreen";

/**
 * 05.3 Check your email, the screen where the user leaves the app. Kerley's rule (Oct 25): the
 * link is opened on the same device, so the copy says so. Back returns to Create account with the
 * fields kept (plan M0, A3).
 */
export default function CheckEmailView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);
  const draft = flow.draftName;

  const resend = async () => {
    setError(null);
    setSending(true);
    try {
      await authClient.resendConfirmation(flow.email.trim());
    } catch (caught) {
      setError(authNotices.failed(caught));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScreen
      badge="mail"
      title="Check your email"
      subtitle={
        <>
          We sent a confirmation link to <Strong>{flow.email.trim() || "your email"}</Strong>. Open it on
          this device to finish creating your account.
        </>
      }
      error={error}
      backLabel="Back to create account"
      onBack={() => router.push("/create-account")}
    >
      {draft && (
        <InlineNotice
          tone="success"
          title="Your draft is saved and waiting"
          body={`${draft} is kept on this device. Come back from your inbox and it will still be here, exactly as you left it.`}
        />
      )}
      <PillButton variant="flat" busy={sending} onClick={resend}>
        Resend email
      </PillButton>
      <AuthRow>
        <TextButton
          tone="muted"
          onClick={() => {
            flow.clearCreateFields();
            router.push("/create-account");
          }}
        >
          Use a different email
        </TextButton>
      </AuthRow>
    </AuthScreen>
  );
}
