"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PillButton from "@/shared/components/ui/PillButton";
import { authClient } from "../api/authClient";
import { useAuthFlow } from "../state/AuthFlowContext";
import { authNotices, type AuthNotice } from "../utils/authNotices";
import AuthScreen, { AuthRow, Strong, TextButton } from "./AuthScreen";

/** 05.5 Reset link sent: a waiting room with Resend. */
export default function ResetLinkSentView() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AuthNotice | null>(null);

  const resend = async () => {
    setError(null);
    setSending(true);
    try {
      await authClient.resetPassword(flow.email.trim());
    } catch (caught) {
      setError(authNotices.failed(caught));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScreen
      badge="check"
      title="Reset link sent"
      subtitle={
        <>
          Follow the link in <Strong>{flow.email.trim() || "your inbox"}</Strong> to set a new password.
          {flow.draftName && " Your draft stays put."}
        </>
      }
      error={error}
      backLabel="Back"
      onBack={flow.exit}
    >
      <PillButton variant="flat" busy={sending} onClick={resend}>
        Resend link
      </PillButton>
      <AuthRow>
        <TextButton tone="muted" onClick={() => router.push("/sign-in")}>
          Back to sign in
        </TextButton>
      </AuthRow>
    </AuthScreen>
  );
}
