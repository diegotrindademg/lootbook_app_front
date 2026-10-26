"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import ActionSheet, { type SheetAction } from "@/shared/components/overlay/ActionSheet";
import { ConfirmDialog, PromptDialog } from "@/shared/components/overlay/Dialog";
import AppColumn from "@/shared/components/layout/AppColumn";
import OfflineBanner, { useOfflineBar } from "@/shared/components/feedback/OfflineBanner";
import LoadFailed from "@/shared/components/feedback/LoadFailed";
import NavBar from "@/shared/components/layout/NavBar";
import TabBar from "@/shared/components/layout/TabBar";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import UndoToast from "@/shared/components/ui/UndoToast";
import { useWide } from "@/shared/hooks/useWide";
import { useCharacterList } from "../hooks/useCharacterList";
import { useLaunchSplash } from "../hooks/useLaunchSplash";
import { SAMPLE_SHEET_PATH } from "@/features/sheet/data/sampleSheet";
import { SAMPLE_CHARACTER } from "../data/sampleCharacter";
import type { CharacterListTab, CharacterSummary } from "../types";
import { emptyLabel, filterCharacters, matchesSearch } from "../utils/filterCharacters";
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
      href={SAMPLE_SHEET_PATH}
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
  const wide = useWide();

  const [tab, setTab] = useState<CharacterListTab>("Recent");
  const [query, setQuery] = useState("");
  const offlineBar = useOfflineBar();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [menuFor, setMenuFor] = useState<CharacterSummary | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [dialog, setDialog] = useState<{ kind: "rename" | "delete"; character: CharacterSummary } | null>(
    null,
  );
  const [revealKey, setRevealKey] = useState<string | null>(null);
  // Archive from Recent can be undone for 6 seconds (Figma 2362:3230); the toast keeps the time.
  const [undoFor, setUndoFor] = useState<CharacterSummary | null>(null);

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

  // Phone: the carousel. Wide (Figma page 1 wide frames): the same cards in a grid, 292 wide, 32 apart.
  const showSlides = (slides: CarouselSlide[], revealCard?: string | null) =>
    wide ? (
      <ul className={styles.grid}>
        {slides.map((slide) => (
          <li key={slide.key}>{slide.render(true)}</li>
        ))}
      </ul>
    ) : (
      <CharacterCarousel key={tab} revealKey={revealCard} slides={slides} />
    );

  let well: React.ReactNode;
  if (list.status === "loading") {
    well = wide ? (
      <ul className={styles.grid} aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <li key={n}>
            <CarouselSkeleton />
          </li>
        ))}
      </ul>
    ) : (
      <CarouselSkeleton />
    );
  } else if (list.status === "error") {
    // Page 8, F2 and F3 (FW1 at wide): the card that failed to load takes the first card's place.
    const failed = <LoadFailed context="list" cause={list.errorCause} onRetry={list.reload} />;
    well = wide ? (
      <ul className={styles.grid}>
        <li>{failed}</li>
      </ul>
    ) : (
      failed
    );
  } else if (visible.length > 0) {
    // S5: the list for this tab.
    well = showSlides(
      visible.map((character) => ({
        key: character.id,
        render: (active: boolean) => (
          <CharacterCard
            name={character.name}
            subtitle={character.subtitle}
            imageUrl={character.imageUrl}
            active={active}
            href={`/characters/${character.id}`}
            onMenu={(event) => {
              setMenuAnchor(event.currentTarget.getBoundingClientRect());
              setMenuFor(character);
            }}
          />
        ),
      })),
      revealKey,
    );
  } else if (list.characters.length === 0 && tab === "Recent" && query.trim() && matchesSearch(SAMPLE_CHARACTER, query)) {
    // With no characters (signed out, or none yet), search covers the sample card too (the lead, Oct 26 2026).
    well = showSlides([sampleSlide]);
  } else if (quietLabel) {
    // Favorites or Archived with nothing in them, or a search with no match (01.5).
    well = <EmptyCharacterCard label={quietLabel} />;
  } else if (list.characters.length === 0) {
    // S3 signed out and S4 signed in: create a character, or look at the sample.
    well = showSlides([createSlide, sampleSlide]);
  } else {
    // Every character is archived: Recent only invites a new one.
    well = showSlides([createSlide]);
  }

  return (
    <AppColumn size="page">
      <main className={styles.screen} inert={overlayOpen || undefined}>
        <NavBar
          signedIn={signedIn}
          profileName={session.user?.displayName}
          profileAvatar={session.user?.avatarUrl}
          signInHref="/sign-in?returnTo=%2F"
          profileHref="/settings"
        />
        <OfflineBanner state={offlineBar} className={offlineBar ? styles.offlineBar : undefined} />
        <div className={styles.controls}>
          <CharacterSearchField
            value={query}
            onChange={setQuery}
            onFocusChange={setSearchFocused}
            inputRef={searchRef}
          />
          <ListTabs active={tab} onChange={setTab} controls={WELL_ID} />
        </div>
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
        // Phone: out of the way while typing or while a sheet is up. Wide: always at the top (Figma).
        hidden={!wide && (searchFocused || overlayOpen)}
        inert={overlayOpen}
      />

      {undoFor && !overlayOpen && (
        <div className={styles.toast}>
          <UndoToast
            key={undoFor.id}
            message={`${undoFor.name} archived`}
            durationMs={6000}
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
        <ActionSheet
          title={menuFor.name}
          actions={menuActions(menuFor)}
          anchor={menuAnchor}
          onClose={() => setMenuFor(null)}
        />
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
