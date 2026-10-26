"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import { takeArrivalNotice, type ArrivalNoticeKind } from "../utils/arrivalNotice";
import styles from "./ArrivalNotice.module.css";

const COPY: Record<ArrivalNoticeKind, { title: string; body: string; tone: "success" | "info"; ms: number; low: boolean }> = {
  "password-changed": { title: "Password changed", body: "You are signed in.", tone: "success", ms: 6000, low: false },
  // Page 7, A7: above the tab bar, so it does not cover the search field; it goes after 4 seconds.
  "signed-out": {
    title: "You are signed out.",
    body: "Your characters stay in your account.",
    tone: "info",
    ms: 4000,
    low: true,
  },
};

/**
 * Shows the confirmation a flow left for the screen it ended on: "Password changed" over the top of the
 * character screen (Figma 2372:2198), gone after 6 seconds, over the search field; "You are signed out."
 * above the tab bar (page 7, A7), gone after 4 seconds.
 */
export default function ArrivalNotice() {
  const pathname = usePathname();
  const [kind, setKind] = useState<ArrivalNoticeKind | null>(null);

  useEffect(() => {
    const next = takeArrivalNotice();
    if (next) setKind(next);
  }, [pathname]);

  useEffect(() => {
    if (!kind) return;
    const timer = window.setTimeout(() => setKind(null), COPY[kind].ms);
    return () => window.clearTimeout(timer);
  }, [kind]);

  if (!kind) return null;
  return (
    <div className={COPY[kind].low ? `${styles.arrival} ${styles.low}` : styles.arrival}>
      <InlineNotice tone={COPY[kind].tone} title={COPY[kind].title} body={COPY[kind].body} />
    </div>
  );
}
