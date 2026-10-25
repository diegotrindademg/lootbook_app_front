"use client";

import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import PlaceholderScreen from "@/shared/components/layout/PlaceholderScreen";
import PillButton from "@/shared/components/ui/PillButton";
import styles from "./SettingsScreen.module.css";

/**
 * WAITING ON DESIGN: Settings is a placeholder. The plan's decision is that it holds the account
 * (email, sign out) and that the avatar opens it, so those two are here to make signing out possible.
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuthSession();

  return (
    <PlaceholderScreen title="Settings" activeTab="settings" createHref="/characters/create">
      {user && (
        <section className={styles.account} aria-label="Account">
          <p className={styles.email}>{user.email}</p>
          <PillButton variant="flat" onClick={signOut}>
            Sign out
          </PillButton>
        </section>
      )}
    </PlaceholderScreen>
  );
}
