"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { charactersApi } from "@/features/characters/api/charactersApi";
import AppColumn from "@/shared/components/layout/AppColumn";
import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import Spinner from "@/shared/components/ui/Spinner";
import { sheetApi } from "../../api/sheetApi";
import { SAMPLE_SHEET } from "../../data/sampleSheet";
import { useResourcePlay } from "../../hooks/useResourcePlay";
import type { CharacterSheet } from "../../types";
import { identityFromBlocks } from "../../utils/blocks";
import BlockView from "../blocks/BlockViews";
import BlockTabs from "./BlockTabs";
import QuickAccessStrip from "./QuickAccessStrip";
import styles from "./SheetScreen.module.css";

type Stage = "image" | "info";

/** How far the band or the panel must be dragged before it moves to the other position. */
const DRAG_THRESHOLD = 60;

/**
 * The character sheet (design `CharacterDetailScreen`, frames 02.0 to 02.6; M0 H3, H4): one screen in
 * two positions. Panel down: the art with the identity band. Panel raised: quick access, one tab per
 * block, the block. Drag the band or the panel's head, or tap it, to move between them. Edit opens
 * the editor; the sheet is for play. `sample` opens the sample character read only.
 */
export default function SheetScreen({ characterId, sample = false }: { characterId: string; sample?: boolean }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<CharacterSheet | null>(sample ? SAMPLE_SHEET : null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">(sample ? "ready" : "loading");
  const [stage, setStage] = useState<Stage>("image");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [favoriteFailed, setFavoriteFailed] = useState(false);
  const play = useResourcePlay(characterId, setSheet);

  const load = useCallback(async () => {
    if (sample) return;
    setPhase("loading");
    try {
      setSheet(await sheetApi.getSheet(characterId));
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, [characterId, sample]);

  useEffect(() => {
    load();
    // Back from sign-in with a draft that was then saved (02.6): say so once.
    const params = new URLSearchParams(window.location.search);
    if (params.get("restored") === "1") {
      setRestored(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [load]);

  const blocks = sheet?.blocks ?? [];
  const active = blocks.find((block) => block.id === activeId) ?? blocks[0];
  const identity = identityFromBlocks(blocks);
  const tall = Boolean(identity.eyebrow || identity.subtitle);

  // Drag the band or the panel's head; a tap with no drag also moves it.
  const drag = useRef<{ startY: number; moved: boolean } | null>(null);
  const [dy, setDy] = useState(0);
  const dragHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      drag.current = { startY: event.clientY, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!drag.current) return;
      const delta = event.clientY - drag.current.startY;
      if (Math.abs(delta) > 4) drag.current.moved = true;
      setDy(delta);
    },
    onPointerUp: () => {
      if (!drag.current) return;
      const { moved } = drag.current;
      drag.current = null;
      const delta = dy;
      setDy(0);
      if (!moved) setStage(stage === "image" ? "info" : "image");
      else if (stage === "image" && delta < -DRAG_THRESHOLD) setStage("info");
      else if (stage === "info" && delta > DRAG_THRESHOLD) setStage("image");
    },
    onPointerCancel: () => {
      drag.current = null;
      setDy(0);
    },
  };

  const toggleFavorite = async () => {
    if (!sheet) return;
    const next = !sheet.favorite;
    setFavoriteFailed(false);
    setSheet({ ...sheet, favorite: next });
    try {
      await charactersApi.setFavorite(sheet.id, next);
    } catch {
      setSheet((current) => current && { ...current, favorite: !next });
      setFavoriteFailed(true);
    }
  };

  const identityStack = sheet && (
    <div className={styles.identity}>
      {identity.eyebrow && <p className={styles.eyebrow}>{identity.eyebrow}</p>}
      <h1 className={styles.name}>{sheet.name}</h1>
      {identity.subtitle && <p className={styles.subtitle}>{identity.subtitle}</p>}
    </div>
  );

  const panelId = "sheet-block-panel";
  const onSetResource = sample ? undefined : play.setResource;

  return (
    <AppColumn className={styles.column}>
      <div className={styles.screen}>
        <div className={stage === "info" ? `${styles.art} ${styles.artCropped}` : styles.art}>
          {sheet?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a portrait from the character, any host
            <img className={styles.image} src={sheet.imageUrl} alt="" />
          ) : (
            <div className={styles.noImage} />
          )}
          <div className={styles.shade} aria-hidden="true" />
        </div>

        <button type="button" className={`${styles.circle} ${styles.back}`} aria-label="Back" onClick={() => router.push("/")}>
          <Icon name="chevronLeft" size={22} />
        </button>
        {sheet && !sample && (
          <>
            <button
              type="button"
              className={`${styles.circle} ${styles.edit}`}
              onClick={() => router.push(`/characters/${sheet.id}/edit`)}
            >
              Edit
            </button>
            <button
              type="button"
              className={`${styles.circle} ${styles.favorite}`}
              aria-label="Favourite"
              aria-pressed={sheet.favorite}
              onClick={toggleFavorite}
            >
              <BlockIcon icon="heart" size={20} filled={sheet.favorite} className={sheet.favorite ? styles.heartOn : undefined} />
            </button>
          </>
        )}
        {sample && <span className={`${styles.circle} ${styles.samplePill}`}>Sample</span>}

        {(restored || favoriteFailed || play.failed) && (
          <div className={styles.banner}>
            {restored && (
              <InlineNotice tone="success" title="Draft restored" body="Signed in and saved. Nothing was lost." />
            )}
            {favoriteFailed && (
              <InlineNotice
                tone="error"
                title="Could not change the favourite"
                body="Check your connection and try again."
                actionLabel="Dismiss"
                onAction={() => setFavoriteFailed(false)}
              />
            )}
            {play.failed && (
              // WAITING ON DESIGN: no frame shows a tap at the table that did not save.
              <InlineNotice
                tone="error"
                title="That change did not save"
                body="No connection. The sheet shows what was last saved."
                actionLabel="Dismiss"
                onAction={play.dismissFailure}
              />
            )}
          </div>
        )}

        {phase === "loading" && (
          <div className={styles.loading} role="status">
            <Spinner size={28} />
            <span className={styles.hidden}>Opening the sheet</span>
          </div>
        )}
        {phase === "error" && (
          <div className={styles.loadError}>
            <InlineNotice
              tone="error"
              title="Could not open this character"
              body="Check your connection and try again."
              actionLabel="Retry"
              onAction={load}
            />
          </div>
        )}

        {sheet && phase === "ready" && stage === "image" && (
          <div
            className={tall ? `${styles.band} ${styles.bandTall}` : styles.band}
            style={dy < 0 ? { transform: `translateY(${dy}px)` } : undefined}
            {...dragHandlers}
          >
            <button
              type="button"
              className={styles.grabber}
              aria-label="Show the sheet"
              aria-expanded={false}
              aria-controls="sheet-panel"
              onClick={() => setStage("info")}
              onPointerDown={(event) => event.stopPropagation()}
            />
            {identityStack}
          </div>
        )}

        {sheet && phase === "ready" && stage === "info" && (
          <section
            className={styles.panel}
            id="sheet-panel"
            aria-label={`${sheet.name}, sheet`}
            style={dy > 0 ? { transform: `translateY(${dy}px)` } : undefined}
          >
            <div className={styles.panelHead} {...dragHandlers}>
              <button
                type="button"
                className={styles.grabber}
                aria-label="Show the art"
                aria-expanded
                aria-controls="sheet-panel"
                onClick={() => setStage("image")}
                onPointerDown={(event) => event.stopPropagation()}
              />
              {identityStack}
              <div className={styles.rule} />
            </div>
            <div className={styles.panelBody}>
              <QuickAccessStrip blocks={blocks} onSetResource={onSetResource} />
              {blocks.length && active ? (
                <>
                  <BlockTabs blocks={blocks} activeId={active.id} onChange={setActiveId} panelId={panelId} />
                  <div id={panelId} role="tabpanel" aria-labelledby={`tab-${active.id}`}>
                    <BlockView key={active.id} block={active} onSetResource={onSetResource} />
                  </div>
                </>
              ) : (
                <p className={styles.noBlocks}>This sheet has no blocks yet. Edit to add some.</p>
              )}
            </div>
          </section>
        )}
        <p className={styles.hidden} role="status" aria-live="polite">
          {play.announcement}
        </p>
      </div>
    </AppColumn>
  );
}
