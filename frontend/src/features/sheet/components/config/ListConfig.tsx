"use client";

import { useState } from "react";
import BlockIcon from "@/shared/components/ui/BlockIcon";
import { BLOCK_ICON_KEYS, type ListBlock, type ListRow } from "../../types";
import { iconName } from "../../utils/blocks";
import { mintId } from "../../utils/ids";
import { Field, SectionLabel, TextAreaField } from "../controls/Field";
import { AddRow, ConfigHint, DetailField, LimitHint, ToggleCard } from "./ConfigRows";
import OptionRow from "./OptionRow";
import SubSheet from "./SubSheet";
import configStyles from "./BlockConfigSheet.module.css";
import styles from "./TypeConfig.module.css";

type ListConfigProps = {
  block: ListBlock;
  onChange: (block: ListBlock) => void;
  /** The names of the character's stat entries, offered for an item's linked attribute (L3 A). */
  statNames: string[];
};

/**
 * A List block's settings (Figma page 5, L1 to L9, pick L3 A): Show icons and Items can be trained as
 * list settings, then the items. An item's pen opens the item editor in a second sheet. Rows live in
 * the sheet document (Kerley's answer 3), not in the equipment tables.
 */
export default function ListConfig({ block, onChange, statNames }: ListConfigProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const set = (patch: Partial<ListBlock>) => onChange({ ...block, ...patch });
  const setRow = (id: string, patch: Partial<ListRow>) =>
    set({ rows: block.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  const remove = (id: string) => set({ rows: block.rows.filter((row) => row.id !== id) });
  const row = editing ? block.rows.find((r) => r.id === editing) : undefined;
  const count = block.rows.length;

  return (
    <>
      <ToggleCard
        title="Show icons"
        body="Each item gets its own icon"
        on={block.showIcons}
        onChange={(showIcons) => set({ showIcons })}
      />
      <ToggleCard
        title="Items can be trained"
        body="Every item gets a box to tick"
        on={block.trainable}
        onChange={(trainable) => set({ trainable })}
      />

      <SectionLabel>Items</SectionLabel>
      <div className={styles.stack}>
        {block.rows.map((r) => (
          <OptionRow
            key={r.id}
            name={r.name}
            detail={r.attribute ? `Uses ${r.attribute}` : r.note || undefined}
            value={r.value}
            check={
              block.trainable
                ? { checked: Boolean(r.trained), label: `${r.name} trained`, onToggle: () => setRow(r.id, { trained: !r.trained }) }
                : undefined
            }
            editLabel={`Edit ${r.name}`}
            onEdit={() => setEditing(r.id)}
            removeLabel={`Remove ${r.name}`}
            onRemove={() => remove(r.id)}
          />
        ))}
        {count < 200 && (
          <AddRow
            label="Item"
            placeholder={count ? "Another item" : "First item"}
            onAdd={(name) => set({ rows: [...block.rows, { id: mintId("r"), name }] })}
          />
        )}
        <LimitHint count={count} max={200} noun="items" />
      </div>

      {row && (
        <SubSheet
          title={row.name}
          kind="Item"
          removeLabel="Remove item"
          onRemove={() => {
            setEditing(null);
            remove(row.id);
          }}
          onDone={() => setEditing(null)}
        >
          <DetailField label="Name">
            <Field
              label="Name"
              value={row.name}
              maxLength={160}
              aria-invalid={!row.name.trim() || undefined}
              onChange={(event) => setRow(row.id, { name: event.target.value })}
            />
            {!row.name.trim() && <p className={styles.fieldError}>An item needs a name</p>}
          </DetailField>
          <DetailField label="Value">
            <Field
              label="Value"
              value={row.value ?? ""}
              maxLength={40}
              onChange={(event) => setRow(row.id, { value: event.target.value })}
            />
            <ConfigHint>Shown as a pill: +5, 3d6 or d8. Up to 40 characters.</ConfigHint>
          </DetailField>
          <DetailField label="Linked attribute">
            <Field
              label="Linked attribute"
              value={row.attribute ?? ""}
              maxLength={120}
              onChange={(event) => setRow(row.id, { attribute: event.target.value })}
            />
            <ConfigHint>{`Text only in v1. The sheet says "Uses ${row.attribute?.trim() || "Might"}".`}</ConfigHint>
            {statNames.length > 0 && (
              <div className={styles.chips} role="group" aria-label="The character's stats">
                {statNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={row.attribute === name}
                    className={row.attribute === name ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                    onClick={() => setRow(row.id, { attribute: row.attribute === name ? "" : name })}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </DetailField>
          {block.trainable && (
            <ToggleCard title="Trained" on={Boolean(row.trained)} onChange={(trained) => setRow(row.id, { trained })} />
          )}
          <DetailField label="Note">
            <TextAreaField
              label="Note"
              rows={3}
              maxLength={500}
              value={row.note ?? ""}
              onChange={(event) => setRow(row.id, { note: event.target.value })}
            />
            {(row.note ?? "").length >= 500 && <ConfigHint>500 characters, the most a note holds.</ConfigHint>}
          </DetailField>
          {block.showIcons && (
            <DetailField label="Icon">
              <div className={styles.iconPick} role="radiogroup" aria-label={`Icon for ${row.name}`}>
                {BLOCK_ICON_KEYS.map((key) => {
                  const on = (row.icon ?? block.icon) === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={iconName(key)}
                      className={on ? `${configStyles.icon} ${configStyles.iconOn}` : configStyles.icon}
                      onClick={() => setRow(row.id, { icon: key })}
                    >
                      <BlockIcon icon={key} size={18} />
                    </button>
                  );
                })}
              </div>
            </DetailField>
          )}
        </SubSheet>
      )}
    </>
  );
}
