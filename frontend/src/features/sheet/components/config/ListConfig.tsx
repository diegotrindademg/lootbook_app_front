import BlockIcon from "@/shared/components/ui/BlockIcon";
import { BLOCK_ICON_KEYS, type ListBlock, type ListRow } from "../../types";
import { mintId } from "../../utils/ids";
import { iconName } from "../../utils/blocks";
import { Field, SectionLabel, TextAreaField } from "../controls/Field";
import Toggle from "../controls/Toggle";
import { AddRow, DetailField, EditorRow, LimitHint } from "./ConfigRows";
import configStyles from "./BlockConfigSheet.module.css";
import styles from "./TypeConfig.module.css";

/**
 * A List block's settings (design `ItemsEditor`): the items, each with its value pill. Rows live in
 * the sheet document (Kerley's answer 3), not in the equipment tables.
 */
export default function ListConfig({ block, onChange }: { block: ListBlock; onChange: (block: ListBlock) => void }) {
  const set = (patch: Partial<ListBlock>) => onChange({ ...block, ...patch });
  const setRow = (id: string, patch: Partial<ListRow>) =>
    set({ rows: block.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) });

  return (
    <>
      <SectionLabel>Items</SectionLabel>
      <div className={styles.stack}>
        {block.rows.map((row) => (
          <EditorRow
            key={row.id}
            name={row.name}
            trailing={row.value ? <span className={styles.previewValue}>{row.value}</span> : null}
            removeLabel={`Remove ${row.name}`}
            onRemove={() => set({ rows: block.rows.filter((r) => r.id !== row.id) })}
            detailsLabel={`Details of ${row.name}`}
            detailsId={`row-details-${row.id}`}
            details={
              // WAITING ON DESIGN: 5 - Blocks draws an item's value, linked attribute, trained mark and note.
              <>
                <DetailField label="Name">
                  <Field
                    label={`Name of ${row.name}`}
                    size="sm"
                    maxLength={160}
                    value={row.name}
                    onChange={(event) => setRow(row.id, { name: event.target.value })}
                  />
                </DetailField>
                <DetailField label="Value">
                  <Field
                    label={`Value of ${row.name}`}
                    size="sm"
                    maxLength={40}
                    value={row.value ?? ""}
                    placeholder="+5, 3d6"
                    onChange={(event) => setRow(row.id, { value: event.target.value })}
                  />
                </DetailField>
                <DetailField label="Linked attribute">
                  <Field
                    label={`Attribute ${row.name} uses`}
                    size="sm"
                    maxLength={120}
                    value={row.attribute ?? ""}
                    placeholder="Might"
                    onChange={(event) => setRow(row.id, { attribute: event.target.value })}
                  />
                </DetailField>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>Show a trained mark</span>
                  <Toggle
                    on={row.trained !== undefined}
                    onChange={(on) => setRow(row.id, { trained: on ? false : undefined })}
                    label={`Show a trained mark on ${row.name}`}
                  />
                </div>
                {row.trained !== undefined && (
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Trained</span>
                    <Toggle
                      on={row.trained}
                      onChange={(trained) => setRow(row.id, { trained })}
                      label={`${row.name} trained`}
                    />
                  </div>
                )}
                <DetailField label="Note">
                  <TextAreaField
                    label={`Note on ${row.name}`}
                    rows={2}
                    maxLength={500}
                    value={row.note ?? ""}
                    onChange={(event) => setRow(row.id, { note: event.target.value })}
                  />
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
              </>
            }
          />
        ))}
        <LimitHint count={block.rows.length} max={200} noun="items" />
        {block.rows.length < 200 && (
          <AddRow
            label="Item"
            placeholder={block.rows.length ? "Another item" : "First item"}
            onAdd={(name) => set({ rows: [...block.rows, { id: mintId("r"), name }] })}
          />
        )}
      </div>
      {/* WAITING ON DESIGN: 5 - Blocks. The model has an icon on every item; the design never drew the switch. */}
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show an icon on each item</span>
        <Toggle on={block.showIcons} onChange={(showIcons) => set({ showIcons })} label="Show an icon on each item" />
      </div>
    </>
  );
}
