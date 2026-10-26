"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/shared/components/overlay/Dialog";
import type { ChoiceBlock, ChoiceMode, ChoiceOption } from "../../types";
import { mintId } from "../../utils/ids";
import { Field, SectionLabel, TextAreaField } from "../controls/Field";
import Segmented from "../controls/Segmented";
import { AddRow, ConfigHint, DetailField, LimitHint } from "./ConfigRows";
import OptionRow from "./OptionRow";
import SubSheet from "./SubSheet";
import styles from "./TypeConfig.module.css";

/**
 * A Choice block's settings (Figma page 5, C1 to C14, picks C3 A and C13 A): pick one, pick several,
 * or free text; the options are the user's own. Tapping an option's name picks it for this character;
 * its pen opens the option editor in a second sheet. Moving to Free text with options asks first.
 */
export default function ChoiceConfig({ block, onChange }: { block: ChoiceBlock; onChange: (block: ChoiceBlock) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState(false);
  const set = (patch: Partial<ChoiceBlock>) => onChange({ ...block, ...patch });
  const picked = new Set(Array.isArray(block.value) ? block.value : block.value ? [block.value] : []);

  const applyMode = (mode: ChoiceMode) =>
    set({
      mode,
      value: mode === "many" ? [] : mode === "text" ? "" : null,
      options: mode === "text" ? [] : block.options,
    });

  const setMode = (mode: ChoiceMode) => {
    if (mode === "text" && block.options.length) setConfirmText(true);
    else applyMode(mode);
  };

  const pick = (id: string) => {
    if (block.mode === "many") {
      set({ value: picked.has(id) ? [...picked].filter((x) => x !== id) : [...picked, id] });
    } else {
      set({ value: picked.has(id) ? null : id });
    }
  };

  const setOption = (id: string, patch: Partial<ChoiceOption>) =>
    set({ options: block.options.map((option) => (option.id === id ? { ...option, ...patch } : option)) });

  const remove = (id: string) =>
    set({
      options: block.options.filter((option) => option.id !== id),
      value: block.mode === "many" ? [...picked].filter((x) => x !== id) : picked.has(id) ? null : block.value,
    });

  const option = editing ? block.options.find((o) => o.id === editing) : undefined;
  const count = block.options.length;

  return (
    <>
      <SectionLabel>Mode</SectionLabel>
      <Segmented<ChoiceMode>
        label="Mode"
        options={[
          ["one", "Pick one"],
          ["many", "Pick several"],
          ["text", "Free text"],
        ]}
        value={block.mode}
        onChange={setMode}
      />

      {block.mode === "text" ? (
        <>
          <SectionLabel>Text</SectionLabel>
          <TextAreaField
            label="Text"
            rows={3}
            maxLength={2000}
            value={typeof block.value === "string" ? block.value : ""}
            placeholder="Write it in your own words"
            onChange={(event) => set({ value: event.target.value })}
          />
        </>
      ) : (
        <>
          <SectionLabel>Options</SectionLabel>
          <div className={styles.stack}>
            {block.options.map((o) => (
              <OptionRow
                key={o.id}
                name={o.name}
                detail={picked.has(o.id) ? o.description : undefined}
                art={picked.has(o.id) && o.art ? o.art : undefined}
                picked={picked.has(o.id)}
                onPick={() => pick(o.id)}
                pickLabel={`Pick ${o.name}`}
                editLabel={`Edit ${o.name}`}
                onEdit={() => setEditing(o.id)}
                removeLabel={`Remove ${o.name}`}
                onRemove={() => remove(o.id)}
              />
            ))}
            {count < 50 && (
              <AddRow
                label="Option"
                placeholder={count ? "Another option" : "Write your first option"}
                onAdd={(name) => set({ options: [...block.options, { id: mintId("o"), name }] })}
              />
            )}
            <LimitHint count={count} max={50} noun="options" />
            {!count && <ConfigHint>Options are yours to write, the app ships no catalogue.</ConfigHint>}
          </div>
        </>
      )}

      {option && (
        <SubSheet
          title={option.name}
          kind="Option"
          removeLabel="Remove option"
          onRemove={() => {
            setEditing(null);
            remove(option.id);
          }}
          onDone={() => setEditing(null)}
        >
          <DetailField label="Name">
            <Field
              label="Name"
              value={option.name}
              maxLength={80}
              aria-invalid={!option.name.trim() || undefined}
              onChange={(event) => setOption(option.id, { name: event.target.value })}
            />
            {!option.name.trim() && <p className={styles.fieldError}>An option needs a name</p>}
          </DetailField>
          {/* WAITING ON DESIGN: page 5 draws "Add art" from the device (C3 to C8); where the file is
              stored is open for Kerley (contract slice 2 v1.1, 10). Until then, a link.
              TODO(Kerley): where option art files are stored (v1.1, no spec yet). */}
          <SectionLabel>Art</SectionLabel>
          <DetailField label="Image link">
            <Field
              label="Image link"
              type="url"
              inputMode="url"
              maxLength={2048}
              value={option.art ?? ""}
              placeholder="https://"
              onChange={(event) => setOption(option.id, { art: event.target.value })}
            />
          </DetailField>
          <DetailField label="Description">
            <TextAreaField
              label="Description"
              rows={4}
              maxLength={2000}
              value={option.description ?? ""}
              onChange={(event) => setOption(option.id, { description: event.target.value })}
            />
            <ConfigHint>
              {(option.description ?? "").length >= 2000
                ? "2000 characters, the most a description holds."
                : "Shown under the name on the sheet"}
            </ConfigHint>
          </DetailField>
          <DetailField label="Grants">
            <TextAreaField
              label="Grants"
              rows={3}
              maxLength={500}
              value={option.grants ?? ""}
              onChange={(event) => setOption(option.id, { grants: event.target.value })}
            />
            <ConfigHint>Text only. It does not change other blocks.</ConfigHint>
          </DetailField>
        </SubSheet>
      )}

      {confirmText &&
        createPortal(
          <ConfirmDialog
            title="Switch to free text?"
            body={`The ${count} option${count === 1 ? "" : "s"} you wrote ${count === 1 ? "goes" : "go"}. Free text keeps one answer in your own words.`}
            confirmLabel="Switch to free text"
            cancelLabel="Keep options"
            destructive
            onConfirm={() => {
              setConfirmText(false);
              applyMode("text");
            }}
            onCancel={() => setConfirmText(false)}
          />,
          document.body,
        )}
    </>
  );
}
