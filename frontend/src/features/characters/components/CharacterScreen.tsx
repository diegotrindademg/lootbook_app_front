"use client";

import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import AppColumn from "@/shared/components/layout/AppColumn";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import styles from "./CharacterScreen.module.css";

/** The character screen at `/` (design 01.x): nav bar, search, list tabs, the carousel, tab bar. */
export default function CharacterScreen() {
  const session = useAuthSession();
  const signedIn = session.status === "checking" ? null : session.status === "signed-in";

  return (
    <AppColumn>
      <main className={styles.screen}>
        <NavBar
          signedIn={signedIn}
          profileName={session.user?.displayName}
          profileAvatar={session.user?.avatarUrl}
          signInHref="/sign-in?returnTo=%2F"
          profileHref="/settings"
        />
      </main>
      <TabBar activeId="characters" createHref="/characters/create" />
    </AppColumn>
  );
}
