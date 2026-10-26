"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import AppColumn from "@/shared/components/layout/AppColumn";
import TabBar from "@/shared/components/layout/TabBar";
import PillButton from "@/shared/components/ui/PillButton";
import Spinner from "@/shared/components/ui/Spinner";
import packageJson from "../../../../package.json";
import styles from "./SettingsScreen.module.css";

/**
 * Settings (contract 3 and v1.1, 6): the account's email, read only, Sign out, and the app version;
 * nothing else in v1.0. The avatar and the tab bar's Settings item open it. Sign out asks nothing
 * first, works offline (it only forgets this device's session) and lands on the signed-out list.
 * Signed out it says "Not signed in" and offers Sign in. At wide, a centred 640 column.
 * WAITING ON DESIGN: 7. Plain until page 7 lands.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { status, user, signOut } = useAuthSession();
  const [leaving, setLeaving] = useState(false);

  const onSignOut = async () => {
    setLeaving(true);
    try {
      await signOut();
    } finally {
      router.push("/");
    }
  };

  return (
    <AppColumn size="page">
      <main className={styles.screen}>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.section} aria-labelledby="settings-account">
          <h2 className={styles.caption} id="settings-account">
            Account
          </h2>
          {status === "checking" && (
            <div className={styles.card} role="status">
              <Spinner size={20} />
              <span className={styles.hidden}>Checking your account</span>
            </div>
          )}
          {status === "signed-in" && user && (
            <>
              <div className={styles.card}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <PillButton variant="flat" busy={leaving} onClick={onSignOut}>
                Sign out
              </PillButton>
            </>
          )}
          {status === "signed-out" && (
            <>
              <div className={styles.card}>
                <span className={styles.value}>Not signed in</span>
              </div>
              <PillButton onClick={() => router.push("/sign-in?returnTo=%2Fsettings")}>Sign in</PillButton>
            </>
          )}
        </section>

        <section className={styles.section} aria-labelledby="settings-about">
          <h2 className={styles.caption} id="settings-about">
            About
          </h2>
          <div className={styles.card}>
            <span className={styles.label}>Version</span>
            <span className={styles.value}>{packageJson.version}</span>
          </div>
        </section>
      </main>
      <TabBar activeId="settings" createHref="/characters/create" />
    </AppColumn>
  );
}
