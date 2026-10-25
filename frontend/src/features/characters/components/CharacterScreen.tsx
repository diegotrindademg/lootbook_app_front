"use client";

import { useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import AppColumn from "@/shared/components/layout/AppColumn";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import { useCharacterList } from "../hooks/useCharacterList";
import { useLaunchSplash } from "../hooks/useLaunchSplash";
import type { CharacterListTab } from "../types";
import CarouselSkeleton from "./CarouselSkeleton";
import CharacterSearchField from "./CharacterSearchField";
import ListTabs from "./ListTabs";
import SplashScreen from "./SplashScreen";
import styles from "./CharacterScreen.module.css";

const WELL_ID = "character-list";

/** The character screen at `/` (design 01.x): nav bar, search, list tabs, the carousel, tab bar. */
export default function CharacterScreen() {
  const splash = useLaunchSplash();
  const session = useAuthSession();
  const signedIn = session.status === "checking" ? null : session.status === "signed-in";
  const list = useCharacterList(signedIn);

  const [tab, setTab] = useState<CharacterListTab>("Recent");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  if (splash.phase === "deciding") return null;
  if (splash.phase === "showing") return <SplashScreen onSkip={splash.skip} />;

  let well: React.ReactNode = null;
  if (list.status === "loading") {
    well = <CarouselSkeleton />;
  } else if (list.status === "error") {
    well = (
      <div className={styles.wellNotice}>
        <InlineNotice
          title="Could not load your characters"
          body="Check your connection and try again."
          actionLabel="Retry"
          onAction={list.reload}
        />
      </div>
    );
  }

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
        <CharacterSearchField
          value={query}
          onChange={setQuery}
          onFocusChange={setSearchFocused}
          inputRef={searchRef}
        />
        <ListTabs active={tab} onChange={setTab} controls={WELL_ID} />
        <section
          id={WELL_ID}
          className={styles.well}
          role="tabpanel"
          aria-label={tab}
          aria-busy={list.status === "loading"}
        >
          {well}
        </section>
      </main>
      <TabBar
        activeId="characters"
        createHref="/characters/create"
        onSearch={() => searchRef.current?.focus()}
        hidden={searchFocused}
      />
    </AppColumn>
  );
}
