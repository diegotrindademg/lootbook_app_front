"use client";

import EmptyCharacterCard from "@/features/characters/components/EmptyCharacterCard";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import OfflineBanner, { useOfflineBar } from "@/shared/components/feedback/OfflineBanner";
import AppColumn from "@/shared/components/layout/AppColumn";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import styles from "./EquipmentsScreen.module.css";

/**
 * The Equipments tab in v1.0 (Figma page 1, Flow 16 2443:3563; E1 signed in 2443:3894, E2 signed out
 * 2443:4030, wide 2443:4189 and 2443:4315): equipment comes in the next version, so the tab shows the
 * quiet empty card and one line pointing to a List block. Built from the list's own parts; only the nav
 * bar changes with sign-in. No search field and no list tabs; the tab bar's Search opens Characters with
 * search focused, and Create starts a new character, as on Characters. No loading or error state.
 */
export default function EquipmentsScreen() {
  const { status, user } = useAuthSession();
  const offlineBar = useOfflineBar();

  return (
    <AppColumn size="page">
      <main className={styles.screen}>
        <NavBar
          signedIn={status === "checking" ? null : status === "signed-in"}
          profileName={user?.displayName}
          profileAvatar={user?.avatarUrl}
          signInHref="/sign-in?returnTo=%2Fequipments"
          profileHref="/settings"
        />
        <OfflineBanner state={offlineBar} className={offlineBar ? styles.offlineBar : undefined} />
        <div className={styles.content}>
          <EmptyCharacterCard label="Equipment is on its way" heading />
          <p className={styles.line}>
            Equipment arrives in the next version. Until then, a List block on any character can track your gear.
          </p>
        </div>
      </main>
      <TabBar activeId="equipments" createHref="/characters/create" />
    </AppColumn>
  );
}
