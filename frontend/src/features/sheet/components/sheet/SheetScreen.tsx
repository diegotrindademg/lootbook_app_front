"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { charactersApi } from "@/features/characters/api/charactersApi";
import LoadFailed, { failureCause, type LoadFailedCause } from "@/shared/components/feedback/LoadFailed";
import OfflineBanner, { useOfflineBar } from "@/shared/components/feedback/OfflineBanner";
import AppColumn from "@/shared/components/layout/AppColumn";
import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import UndoToast from "@/shared/components/ui/UndoToast";
import { useWide } from "@/shared/hooks/useWide";
import { sheetApi } from "../../api/sheetApi";
import { SAMPLE_SHEET } from "../../data/sampleSheet";
import { listTitles, refills, type ResourceSet, useResourcePlay } from "../../hooks/useResourcePlay";
import type { CharacterSheet, ResourceBlock } from "../../types";
import { identityFromBlocks } from "../../utils/blocks";
import BlockView from "../blocks/BlockViews";
import BlockSections from "./BlockSections";
import BlockTabs from "./BlockTabs";
import QuickAccessStrip, { NewSessionChip } from "./QuickAccessStrip";
import SheetSkeleton from "./SheetSkeleton";
import styles from "./SheetScreen.module.css";

type Stage = "image" | "info";

/** How far the band or the panel must be dragged before it moves to the other position. */
const DRAG_THRESHOLD = 60;

/**
 * The character sheet (design `CharacterDetailScreen`, frames 02.0 to 02.6; M0 H3, H4): one screen in
 * two positions. Panel down: the art with the identity band. Panel raised: quick access, one tab per
 * block, the block. Drag the band or the panel's head, or tap it, to move between them. Edit opens
 * the editor; the sheet is for play. `sample` opens the sample character read only.
 * At wide (Figma "H1 · Brakka · wide" 2415:34098) there are no positions: the art holds the left 480
 * with the identity at its foot, and every block is on the page at the right, the tabs scrolling to it.
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
  const [refilled, setRefilled] = useState<{ message: string; changes: ResourceSet[] } | null>(null);
  const [fullNote, setFullNote] = useState("");
  const wide = useWide();
  const offlineBar = useOfflineBar();
  const [loadCause, setLoadCause] = useState<LoadFailedCause>("offline");
  const mainRef = useRef<HTMLDivElement>(null);
  /** While a tab's scroll runs, the scroll does not move the current tab. */
  const jumping = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (sample) return;
    setPhase("loading");
    try {
      setSheet(await sheetApi.getSheet(characterId));
      setPhase("ready");
    } catch (error) {
      setLoadCause(failureCause(error));
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

  // Wide: the tab of the section at the top of the page is the current one.
  useEffect(() => {
    const main = mainRef.current;
    if (!wide || !main) return;
    const onScroll = () => {
      if (jumping.current !== null) return;
      const line = main.getBoundingClientRect().top + 120;
      const list = sheet?.blocks ?? [];
      let current = list[0]?.id ?? null;
      for (const block of list) {
        const top = document.getElementById(`block-${block.id}`)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = block.id;
      }
      setActiveId(current);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [wide, sheet?.blocks]);

  const jumpTo = (id: string) => {
    setActiveId(id);
    if (jumping.current !== null) window.clearTimeout(jumping.current);
    jumping.current = window.setTimeout(() => {
      jumping.current = null;
    }, 900);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

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

  // Figma page 6, Flow 12, option A (contract v1.1, 9): New session refills every Each session
  // resource to its maximum; a Manual or Custom block refills from its own Reset link. Both offer Undo.
  const sessionBlocks = blocks.filter(
    (block): block is ResourceBlock => block.type === "resource" && block.reset.mode === "session",
  );
  const refill = (targets: ResourceBlock[], label: string) => {
    const changes = refills(targets);
    if (!changes.length) {
      setFullNote(`${listTitles(targets.map((b) => b.title))} ${targets.length === 1 ? "is" : "are"} already full.`);
      return;
    }
    setFullNote("");
    play.setMany(changes, label);
    const titles = [...new Set(changes.map((c) => blocks.find((b) => b.id === c.blockId)?.title ?? ""))];
    setRefilled({ message: `${listTitles(titles)} refilled`, changes });
  };
  // A refill that did not save has nothing to undo.
  useEffect(() => {
    if (play.failure) setRefilled(null);
  }, [play.failure]);
  const onNewSession = sample || !sessionBlocks.length ? undefined : () => refill(sessionBlocks, "New session");
  const onResetResource = sample ? undefined : (block: ResourceBlock) => refill([block], block.title);
  const pinned = blocks.some((block) => block.pinned);

  const backButton = (
    <button type="button" className={`${styles.circle} ${styles.back}`} aria-label="Back" onClick={() => router.push("/")}>
      <Icon name="chevronLeft" size={22} />
    </button>
  );
  const topButtons = (
    <>
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
    </>
  );
  const banner = (
    <>
      {(restored || favoriteFailed) && (
        <div className={offlineBar ? `${styles.banner} ${styles.bannerLow}` : styles.banner}>
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
        </div>
      )}
    </>
  );
  // Page 8, P3 to P6 (PW1 at wide): at the foot, "Health not saved" with Retry, then "Saving Health".
  const playNotice = (play.failure || play.saving) && (
    <div className={styles.playNotice}>
      {play.failure ? (
        <InlineNotice
          tone="error"
          title={play.failure.title}
          body={play.failure.body}
          actionLabel="Retry"
          onAction={play.failure.retry}
        />
      ) : (
        play.saving && <InlineNotice tone="info" title={play.saving.title} body={play.saving.body} />
      )}
    </div>
  );
  const offline = <OfflineBanner state={offlineBar} className={offlineBar ? styles.offlineBar : undefined} />;
  // Page 8, F5 A (the skeleton) while it loads; F7 and F8 (FW3 at wide) when it could not.
  const skeleton = phase === "loading" && <SheetSkeleton wide={wide} />;
  const loadFailed = phase === "error" && (
    <div className={styles.loadError}>
      <LoadFailed context="sheet" cause={loadCause} onRetry={load} />
    </div>
  );
  const liveAndToast = (
    <>
      <p className={styles.hidden} role="status" aria-live="polite">
        {fullNote || play.announcement}
      </p>
      {refilled && (
        <div className={styles.toast}>
          <UndoToast
            key={refilled.message + refilled.changes.length}
            message={refilled.message}
            durationMs={6000}
            onUndo={() => {
              play.setMany(refilled.changes.map((c) => ({ ...c, from: c.to, to: c.from })), "Undo");
              setRefilled(null);
            }}
            onDismiss={() => setRefilled(null)}
          />
        </div>
      )}
    </>
  );

  if (wide) {
    return (
      <AppColumn size="page" className={styles.column}>
        <div className={offlineBar ? `${styles.wide} ${styles.wideOffline}` : styles.wide}>
          <aside className={styles.wideArt}>
            {sheet?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a portrait from the character, any host
              <img className={styles.image} src={sheet.imageUrl} alt="" />
            ) : (
              <div className={styles.noImage} />
            )}
            <div className={styles.shade} aria-hidden="true" />
            {sheet && phase === "ready" && <div className={`${styles.band} ${styles.bandTall}`}>{identityStack}</div>}
          </aside>
          {skeleton}
          {backButton}
          {topButtons}
          <div className={styles.wideMain} ref={mainRef}>
            <div className={styles.wideContent}>
              {banner}
              {loadFailed}
              {sheet && phase === "ready" && (
                <>
                  <QuickAccessStrip blocks={blocks} onSetResource={onSetResource} onNewSession={onNewSession} />
                  {!pinned && onNewSession && (
                    // WAITING ON DESIGN: page 6 puts New session on the strip; with nothing pinned there is no strip.
                    <div className={styles.newSessionRow}>
                      <NewSessionChip onClick={onNewSession} />
                    </div>
                  )}
                  {blocks.length && active ? (
                    <>
                      <BlockTabs blocks={blocks} activeId={active.id} onChange={jumpTo} anchors />
                      <BlockSections blocks={blocks} onSetResource={onSetResource} onResetResource={onResetResource} />
                    </>
                  ) : (
                    <p className={styles.noBlocks}>This sheet has no blocks yet. Edit to add some.</p>
                  )}
                </>
              )}
            </div>
          </div>
          {offline}
          {playNotice}
          {liveAndToast}
        </div>
      </AppColumn>
    );
  }

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

        {backButton}
        {topButtons}

        {skeleton}
        {offline}
        {banner}
        {loadFailed}

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
              <QuickAccessStrip blocks={blocks} onSetResource={onSetResource} onNewSession={onNewSession} />
              {!pinned && onNewSession && (
                // WAITING ON DESIGN: page 6 puts New session on the strip; with nothing pinned there is no strip.
                <div className={styles.newSessionRow}>
                  <NewSessionChip onClick={onNewSession} />
                </div>
              )}
              {blocks.length && active ? (
                <>
                  <BlockTabs blocks={blocks} activeId={active.id} onChange={setActiveId} panelId={panelId} />
                  <div id={panelId} role="tabpanel" aria-labelledby={`tab-${active.id}`}>
                    <BlockView
                      key={active.id}
                      block={active}
                      onSetResource={onSetResource}
                      onResetResource={onResetResource}
                    />
                  </div>
                </>
              ) : (
                <p className={styles.noBlocks}>This sheet has no blocks yet. Edit to add some.</p>
              )}
            </div>
          </section>
        )}
        {playNotice}
        {liveAndToast}
      </div>
    </AppColumn>
  );
}
