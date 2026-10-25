"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import { takeArrivalNotice, type ArrivalNoticeKind } from "../utils/arrivalNotice";
import styles from "./ArrivalNotice.module.css";

const COPY: Record<ArrivalNoticeKind, { title: string; body: string }> = {
  "password-changed": { title: "Password changed", body: "You are signed in." },
};

/**
 * Shows the confirmation the sign-in flow left for the screen it ended on (Figma 2372:2198: over the
 * top of the character screen). It sits over the search field, so it leaves after 6 seconds.
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
    const timer = window.setTimeout(() => setKind(null), 6000);
    return () => window.clearTimeout(timer);
  }, [kind]);

  if (!kind) return null;
  return (
    <div className={styles.arrival}>
      <InlineNotice tone="success" title={COPY[kind].title} body={COPY[kind].body} />
    </div>
  );
}
