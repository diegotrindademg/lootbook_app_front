"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import { announceOnArrival } from "@/features/auth/utils/arrivalNotice";
import AppColumn from "@/shared/components/layout/AppColumn";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import Icon from "@/shared/components/ui/Icon";
import Spinner from "@/shared/components/ui/Spinner";
import packageJson from "../../../../package.json";
import styles from "./SettingsScreen.module.css";

/**
 * Settings (Figma page 7, Flow 14, T1 2425:36558; wide 2427:39701): the nav bar on top, then ACCOUNT
 * ("Signed in as" and the email, read only, and a Sign out row) and ABOUT (the app version). The
 * avatar and the tab bar's Settings item open it. Sign out asks nothing, works offline (it only forgets
 * this device's session) and lands on the signed-out list with "You are signed out." for 4 seconds.
 * Signed out: "Not signed in" and Sign in, which comes back here. At wide, a centred 640 column.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const session = useAuthSession();
  const { status, user } = session;
  const [leaving, setLeaving] = useState(false);

  const onSignOut = async () => {
    setLeaving(true);
    try {
      await session.signOut();
    } finally {
      announceOnArrival("signed-out");
      router.push("/");
    }
  };

  return (
    <AppColumn size="page">
      <main className={styles.screen}>
        <NavBar
          signedIn={status === "checking" ? null : status === "signed-in"}
          profileName={user?.displayName}
          profileAvatar={user?.avatarUrl}
          signInHref="/sign-in?returnTo=%2Fsettings"
          profileHref="/settings"
        />
        <div className={styles.column}>
          <h1 className={styles.title}>Settings</h1>

          <section className={styles.section} aria-labelledby="settings-account">
            <h2 className={styles.caption} id="settings-account">
              Account
            </h2>
            {status === "checking" && (
              <div className={`${styles.card} ${styles.checking}`} role="status">
                <Spinner size={20} />
                <span className={styles.hidden}>Checking your account</span>
              </div>
            )}
            {status === "signed-in" && user && (
              <div className={styles.card}>
                <div className={styles.signedInAs}>
                  <span className={styles.label}>Signed in as</span>
                  <span className={styles.email}>{user.email}</span>
                </div>
                <div className={styles.hairline} />
                <button type="button" className={styles.row} onClick={onSignOut} disabled={leaving}>
                  <Icon name="logout" size={20} className={styles.rowIcon} />
                  Sign out
                </button>
              </div>
            )}
            {status === "signed-out" && (
              <div className={`${styles.card} ${styles.notSignedIn}`}>
                <span className={styles.email}>Not signed in</span>
                <span className={styles.label}>Sign in to keep your characters in your account.</span>
                <button
                  type="button"
                  className={styles.signIn}
                  onClick={() => router.push("/sign-in?returnTo=%2Fsettings")}
                >
                  Sign in
                </button>
              </div>
            )}
          </section>

          <section className={styles.section} aria-labelledby="settings-about">
            <h2 className={styles.caption} id="settings-about">
              About
            </h2>
            <div className={styles.card}>
              <div className={styles.version}>
                <span className={styles.versionLabel}>App version</span>
                <span className={styles.versionValue}>{packageJson.version}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <TabBar activeId="settings" createHref="/characters/create" />
    </AppColumn>
  );
}
