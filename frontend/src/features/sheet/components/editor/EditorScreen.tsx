"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/state/AuthSessionContext";
import AppColumn from "@/shared/components/layout/AppColumn";
import BottomSheet from "@/shared/components/overlay/BottomSheet";
import { ConfirmDialog } from "@/shared/components/overlay/Dialog";
import Icon from "@/shared/components/ui/Icon";
import InlineNotice from "@/shared/components/ui/InlineNotice";
import Spinner from "@/shared/components/ui/Spinner";
import UndoToast from "@/shared/components/ui/UndoToast";
import { SheetConflictError, sheetApi } from "../../api/sheetApi";
import type { BlockPreset } from "../../data/blockPresets";
import { editorReducer } from "../../state/editorReducer";
import type { SheetBlock, SheetDraft } from "../../types";
import { blockFromPreset, blockHasContent } from "../../utils/blocks";
import {
  RESUME_NEW_DRAFT_PATH,
  clearDeviceDraft,
  readDeviceDraft,
  writeDeviceDraft,
} from "../../utils/deviceDraft";
import { assignKeys, draftFromSheet, toPayload } from "../../utils/sheetMapping";
import BlockConfigSheet from "../config/BlockConfigSheet";
import GhostPill from "../controls/GhostPill";
import BlockLibrary from "../library/BlockLibrary";
import BlockList from "./BlockList";
import styles from "./EditorScreen.module.css";

type OpenSheet = { kind: "library" } | { kind: "config"; id: string } | null;
type OpenDialog = { kind: "discard" } | { kind: "remove"; id: string } | null;
type SaveNotice = { kind: "failed" } | { kind: "conflict"; currentRevision: number } | null;

const EMPTY_DRAFT: SheetDraft = { name: "", blocks: [] };

/** Design 03.8: why Save is off, shown under it. */
function saveHintFor(draft: SheetDraft) {
  const named = Boolean(draft.name.trim());
  if (!named && !draft.blocks.length) return "Name it and add a block to save";
  if (!named) return "Give your character a name to save it";
  if (!draft.blocks.length) return "Add at least one block to save";
  return "";
}

/**
 * Creation and edit (design 03.x, plan M0 C1 to C4). The only place a character is composed: name,
 * blocks in order, the library to add one, a bottom sheet to configure one. No tab bar.
 * `characterId` null is a new character; otherwise the editor opens that character's sheet.
 */
export default function EditorScreen({ characterId }: { characterId: string | null }) {
  const router = useRouter();
  const session = useAuthSession();
  const isNew = characterId === null;
  const [state, dispatch] = useReducer(editorReducer, { draft: EMPTY_DRAFT, removed: null });
  const { draft } = state;
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<SaveNotice>(null);
  const [resume, setResume] = useState(false);
  const baseRevision = useRef(0);
  const original = useRef<SheetDraft | null>(null);
  const autoSaved = useRef(false);

  // Open: a new character from the draft on this device (or empty, with the library up at once, C2);
  // an existing one from the device draft when an edit was left unsaved, else from its sheet.
  const load = useCallback(async () => {
    setPhase("loading");
    const stored = readDeviceDraft(characterId);
    setResume(new URLSearchParams(window.location.search).get("resume") === "1");
    if (isNew) {
      const next = stored?.draft ?? EMPTY_DRAFT;
      dispatch({ type: "load", draft: next });
      if (!next.blocks.length) setSheet({ kind: "library" });
      setPhase("ready");
      return;
    }
    try {
      if (stored) {
        baseRevision.current = stored.baseRevision;
        original.current = stored.original;
        dispatch({ type: "load", draft: stored.draft });
        if (!stored.draft.blocks.length) setSheet({ kind: "library" });
      } else {
        const opened = await sheetApi.getSheet(characterId);
        const fromSheet = draftFromSheet(opened);
        baseRevision.current = opened.revision;
        original.current = fromSheet;
        dispatch({ type: "load", draft: fromSheet });
        if (!fromSheet.blocks.length) setSheet({ kind: "library" });
      }
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, [characterId, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const changed = isNew
    ? Boolean(draft.name.trim() || draft.blocks.length)
    : JSON.stringify(draft) !== JSON.stringify(original.current);

  // Keep the draft on the device while it differs from what is saved (Kerley, Oct 25).
  useEffect(() => {
    if (phase !== "ready") return;
    if (changed) {
      writeDeviceDraft({
        version: 1,
        characterId,
        baseRevision: baseRevision.current,
        original: original.current,
        draft,
      });
    } else {
      clearDeviceDraft(characterId);
    }
  }, [phase, changed, draft, characterId]);

  const saveHint = saveHintFor(draft);
  const canSave = !saveHint;
  const sheetPath = (id: string, restored = false) => `/characters/${id}${restored ? "?restored=1" : ""}`;

  const save = useCallback(
    async (restored = false) => {
      if (!canSave || saving) return;
      if (session.status !== "signed-in") {
        // Signed out: the draft is already on the device; sign-in brings the user back here to save it.
        const back = isNew ? RESUME_NEW_DRAFT_PATH : `/characters/${characterId}/edit?resume=1`;
        router.push(`/sign-in?returnTo=${encodeURIComponent(back)}`);
        return;
      }
      setSaving(true);
      setNotice(null);
      dispatch({ type: "forgetRemoved" });
      const blocks = assignKeys(draft.blocks);
      const name = draft.name.trim();
      const payload = toPayload(blocks);
      try {
        let id = characterId;
        if (id === null) {
          ({ id } = await sheetApi.createCharacter({ name, payload }));
        } else {
          await sheetApi.saveSheet(id, {
            name,
            nameChanged: name !== original.current?.name,
            baseRevision: baseRevision.current,
            payload,
          });
        }
        clearDeviceDraft(characterId);
        router.replace(sheetPath(id, restored));
      } catch (error) {
        // The keys given in this attempt stay, so a retry sends the same document.
        dispatch({ type: "replaceAll", blocks });
        setSaving(false);
        if (error instanceof SheetConflictError) setNotice({ kind: "conflict", currentRevision: error.currentRevision });
        else setNotice({ kind: "failed" });
      }
    },
    [canSave, saving, session.status, isNew, characterId, draft, router],
  );

  // Back from sign-in with a draft (05.0 to C4): save it at once and land on the new sheet.
  useEffect(() => {
    if (phase !== "ready" || !resume || autoSaved.current || session.status !== "signed-in") return;
    autoSaved.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    if (canSave) save(true);
  }, [phase, resume, session.status, canSave, save]);

  const leave = () => {
    clearDeviceDraft(characterId);
    router.push(isNew ? "/" : sheetPath(characterId));
  };

  const cancel = () => {
    if (changed) setDialog({ kind: "discard" });
    else leave();
  };

  const pickPreset = (preset: BlockPreset) => {
    dispatch({ type: "add", block: blockFromPreset(preset) });
    setSheet(null);
    setLibraryQuery("");
  };

  const requestRemove = (block: SheetBlock) => {
    setSheet(null);
    if (blockHasContent(block)) setDialog({ kind: "remove", id: block.id });
    else dispatch({ type: "remove", id: block.id });
  };

  const configuring = sheet?.kind === "config" ? draft.blocks.find((b) => b.id === sheet.id) : undefined;
  const removing = dialog?.kind === "remove" ? draft.blocks.find((b) => b.id === dialog.id) : undefined;
  const overlayOpen = Boolean(sheet || dialog);
  const busy = saving || phase !== "ready";

  return (
    <AppColumn className={styles.column}>
      <div className={styles.screen} inert={overlayOpen || undefined}>
        <header className={styles.top}>
          <button type="button" className={styles.cancel} onClick={cancel} disabled={saving}>
            Cancel
          </button>
          <GhostPill
            tone="teal"
            busy={saving}
            inactive={!canSave && !saving}
            disabled={phase !== "ready"}
            ariaDescribedBy={!canSave ? "save-hint" : undefined}
            onClick={() => save()}
          >
            {saving ? "Saving" : "Save"}
          </GhostPill>
        </header>
        {!canSave && !saving && phase === "ready" && (
          <p id="save-hint" className={styles.saveHint}>
            {saveHint}
          </p>
        )}

        <input
          className={draft.name ? `${styles.name} ${styles.named}` : styles.name}
          type="text"
          value={draft.name}
          placeholder="Character name"
          aria-label="Character name"
          maxLength={120}
          disabled={busy}
          onChange={(event) => dispatch({ type: "rename", name: event.target.value })}
        />

        <main className={saving ? `${styles.body} ${styles.dimmed}` : styles.body} aria-busy={busy || undefined}>
          {phase === "loading" && (
            <div className={styles.loading} role="status">
              <Spinner size={24} />
              <span className={styles.hiddenText}>Opening the sheet</span>
            </div>
          )}
          {phase === "error" && (
            // WAITING ON DESIGN: no frame shows an editor that could not open.
            <InlineNotice
              tone="error"
              title="Could not open this character"
              body="Check your connection and try again."
              actionLabel="Retry"
              onAction={load}
            />
          )}
          {phase === "ready" && (
            <BlockList
              blocks={draft.blocks}
              emptyHint="No blocks yet. Add the first one from the library."
              onConfigure={(block) => setSheet({ kind: "config", id: block.id })}
              onTogglePin={(block) => dispatch({ type: "togglePin", id: block.id })}
              onMove={(from, to) => dispatch({ type: "move", from, to })}
            />
          )}
        </main>

        {(notice || state.removed) && (
          <div className={styles.stack}>
            {notice?.kind === "failed" && (
              <InlineNotice
                tone="error"
                title="Could not save"
                body="No connection. Your draft is still here, nothing was lost."
                actionLabel="Retry"
                onAction={() => save(resume)}
              />
            )}
            {notice?.kind === "conflict" && (
              // WAITING ON DESIGN: the spec's plain notice for a sheet saved on another device.
              <InlineNotice
                tone="error"
                title="Saved on another device"
                body="This sheet changed after you opened it. Save again to keep your version."
                actionLabel="Save mine"
                onAction={() => {
                  baseRevision.current = notice.currentRevision;
                  save(resume);
                }}
              />
            )}
            {state.removed && (
              <UndoToast
                key={state.removed.block.id}
                message={`${state.removed.block.title} removed`}
                durationMs={6000}
                onUndo={() => dispatch({ type: "undoRemove" })}
                onDismiss={() => dispatch({ type: "forgetRemoved" })}
              />
            )}
          </div>
        )}

        <footer className={styles.footer}>
          <button type="button" className={styles.addBlock} onClick={() => setSheet({ kind: "library" })} disabled={busy}>
            <Icon name="plus" size={20} />
            Add block
          </button>
        </footer>
      </div>

      {sheet && (
        <BottomSheet
          label={sheet.kind === "library" ? "Add a block" : `Configure ${configuring?.title ?? "block"}`}
          onClose={() => setSheet(null)}
        >
          {sheet.kind === "library" ? (
            <BlockLibrary
              query={libraryQuery}
              onQueryChange={setLibraryQuery}
              onPick={pickPreset}
              onClose={() => setSheet(null)}
            />
          ) : (
            configuring && (
              <BlockConfigSheet
                key={configuring.id}
                block={configuring}
                onChange={(block) => dispatch({ type: "change", block })}
                onRemove={() => requestRemove(configuring)}
                onDone={() => setSheet(null)}
              />
            )
          )}
        </BottomSheet>
      )}

      {dialog?.kind === "discard" && (
        <ConfirmDialog
          title={isNew ? "Discard this character?" : "Discard your changes?"}
          body={isNew ? "Nothing has been saved. The blocks you added will be lost." : "The sheet keeps what was last saved."}
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          destructive
          onConfirm={leave}
          onCancel={() => setDialog(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.title}?`}
          body="What you have written in this block goes with it. You can undo right after."
          confirmLabel="Remove block"
          cancelLabel="Keep it"
          destructive
          onConfirm={() => {
            dispatch({ type: "remove", id: removing.id });
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </AppColumn>
  );
}
