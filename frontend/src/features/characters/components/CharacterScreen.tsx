"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import ActionSheet, { type SheetAction } from "@/shared/components/overlay/ActionSheet";
import { ConfirmDialog, PromptDialog } from "@/shared/components/overlay/Dialog";
import AppColumn from "@/shared/components/layout/AppColumn";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import UndoToast from "@/shared/components/ui/UndoToast";
import { useCharacterList } from "../hooks/useCharacterList";
import { useLaunchSplash } from "../hooks/useLaunchSplash";
import { SAMPLE_CHARACTER } from "../data/sampleCharacter";
import type { CharacterListTab, CharacterSummary } from "../types";
import { emptyLabel, filterCharacters } from "../utils/filterCharacters";
import CarouselSkeleton from "./CarouselSkeleton";
import CharacterCard from "./CharacterCard";
import CharacterCarousel, { type CarouselSlide } from "./CharacterCarousel";
import CharacterSearchField from "./CharacterSearchField";
import EmptyCharacterCard from "./EmptyCharacterCard";
import ListTabs from "./ListTabs";
import SplashScreen from "./SplashScreen";
import styles from "./CharacterScreen.module.css";

const WELL_ID = "character-list";

const createSlide: CarouselSlide = {
  key: "create",
  render: () => <EmptyCharacterCard label="Create new character" href="/characters/create" />,
};

const sampleSlide: CarouselSlide = {
  key: SAMPLE_CHARACTER.id,
  render: (active) => (
    <CharacterCard
      name={SAMPLE_CHARACTER.name}
      subtitle={SAMPLE_CHARACTER.subtitle}
      imageUrl={SAMPLE_CHARACTER.imageUrl}
      active={active}
      badge="Sample"
    />
  ),
};

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

  const router = useRouter();
  const [menuFor, setMenuFor] = useState<CharacterSummary | null>(null);
  const [dialog, setDialog] = useState<{ kind: "rename" | "delete"; character: CharacterSummary } | null>(
    null,
  );
  const [revealKey, setRevealKey] = useState<string | null>(null);
  // Archive from Recent can be undone for 6 seconds (Figma 2362:3230).
  const [undoFor, setUndoFor] = useState<CharacterSummary | null>(null);
  useEffect(() => {
    if (!undoFor) return;
    const timer = window.setTimeout(() => setUndoFor(null), 6000);
    return () => window.clearTimeout(timer);
  }, [undoFor]);

  // The Search tab on other screens links to /?search=1: focus the field once the screen is up.
  useEffect(() => {
    if (splash.phase !== "done") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("search") !== "1") return;
    searchRef.current?.focus();
    url.searchParams.delete("search");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [splash.phase]);

  if (splash.phase === "deciding") return null;
  if (splash.phase === "showing") return <SplashScreen onSkip={splash.skip} />;

  const visible = filterCharacters(list.characters, tab, query);

  const menuActions = (character: CharacterSummary): SheetAction[] => {
    const archived = character.status === "ARCHIVED";
    return [
      { label: "Edit", icon: "sliders", onSelect: () => router.push(`/characters/${character.id}/edit`) },
      { label: "Rename", icon: "pen", onSelect: () => setDialog({ kind: "rename", character }) },
      {
        label: "Duplicate",
        icon: "copy",
        onSelect: async () => {
          const copy = await list.actions.duplicate(character);
          if (!copy) return;
          setTab("Recent");
          setRevealKey(copy.id);
        },
      },
      archived
        ? { label: "Unarchive", icon: "archive", onSelect: () => list.actions.unarchive(character) }
        : {
            label: "Archive",
            icon: "archive",
            onSelect: () => {
              list.actions.archive(character);
              if (tab === "Recent") setUndoFor(character);
            },
          },
      {
        label: "Delete",
        icon: "trash",
        destructive: true,
        onSelect: () => setDialog({ kind: "delete", character }),
      },
    ];
  };
  const overlayOpen = Boolean(menuFor || dialog);
  const quietLabel = emptyLabel(tab, query);

  let well: React.ReactNode;
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
  } else if (visible.length > 0) {
    // S5: the list for this tab.
    well = (
      <CharacterCarousel
        key={tab}
        revealKey={revealKey}
        slides={visible.map((character) => ({
          key: character.id,
          render: (active) => (
            <CharacterCard
              name={character.name}
              subtitle={character.subtitle}
              imageUrl={character.imageUrl}
              active={active}
              href={`/characters/${character.id}`}
              onMenu={() => setMenuFor(character)}
            />
          ),
        }))}
      />
    );
  } else if (quietLabel) {
    // Favorites or Archived with nothing in them, or a search with no match (01.5).
    well = <EmptyCharacterCard label={quietLabel} />;
  } else if (list.characters.length === 0) {
    // S3 signed out and S4 signed in: create a character, or look at the sample.
    well = <CharacterCarousel slides={[createSlide, sampleSlide]} />;
  } else {
    // Every character is archived: Recent only invites a new one.
    well = <CharacterCarousel slides={[createSlide]} />;
  }

  return (
    <AppColumn>
      <main className={styles.screen} inert={overlayOpen || undefined}>
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
        hidden={searchFocused || overlayOpen}
      />

      {undoFor && !overlayOpen && (
        <div className={styles.toast}>
          <UndoToast
            message={`${undoFor.name} archived`}
            onUndo={() => {
              list.actions.unarchive(undoFor);
              setUndoFor(null);
            }}
            onDismiss={() => setUndoFor(null)}
          />
        </div>
      )}

      {list.failure && (
        <div className={styles.failure}>
          <InlineNotice
            title={list.failure}
            body="Nothing was changed. Check your connection and try again."
            actionLabel="OK"
            onAction={list.clearFailure}
          />
        </div>
      )}

      {menuFor && (
        <ActionSheet title={menuFor.name} actions={menuActions(menuFor)} onClose={() => setMenuFor(null)} />
      )}

      {dialog?.kind === "rename" && (
        <PromptDialog
          title="Rename"
          label="Character name"
          initialValue={dialog.character.name}
          placeholder="Character name"
          confirmLabel="Rename"
          onConfirm={(name) => {
            list.actions.rename(dialog.character, name);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title={`Delete ${dialog.character.name}?`}
          body="This cannot be undone. The sheet and everything on it goes."
          confirmLabel="Delete character"
          cancelLabel="Keep it"
          destructive
          onConfirm={() => {
            list.actions.remove(dialog.character);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </AppColumn>
  );
}
