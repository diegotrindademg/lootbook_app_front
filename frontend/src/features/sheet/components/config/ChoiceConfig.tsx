import type { ChoiceBlock, ChoiceMode, ChoiceOption } from "../../types";
import { mintId } from "../../utils/ids";
import { Field, SectionLabel, TextAreaField } from "../controls/Field";
import Segmented from "../controls/Segmented";
import { AddRow, ConfigHint, DetailField, EditorRow } from "./ConfigRows";
import styles from "./TypeConfig.module.css";

/**
 * A Choice block's settings (design 03.4): pick one, pick several, or free text; the options are the
 * user's own. Tapping an option picks it for this character.
 */
export default function ChoiceConfig({ block, onChange }: { block: ChoiceBlock; onChange: (block: ChoiceBlock) => void }) {
  const set = (patch: Partial<ChoiceBlock>) => onChange({ ...block, ...patch });
  const picked = new Set(Array.isArray(block.value) ? block.value : block.value ? [block.value] : []);

  const setMode = (mode: ChoiceMode) =>
    set({ mode, value: mode === "many" ? [] : mode === "text" ? "" : null });

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
            {block.options.map((option) => (
              <EditorRow
                key={option.id}
                name={option.name}
                picked={picked.has(option.id)}
                onPick={() => pick(option.id)}
                pickLabel={`Pick ${option.name}`}
                removeLabel={`Remove ${option.name}`}
                onRemove={() => remove(option.id)}
                detailsLabel={`Details of ${option.name}`}
                detailsId={`option-details-${option.id}`}
                details={
                  // WAITING ON DESIGN: 5 - Blocks draws an option's art and description.
                  <>
                    <DetailField label="Name">
                      <Field
                        label={`Name of ${option.name}`}
                        size="sm"
                        value={option.name}
                        maxLength={80}
                        onChange={(event) => setOption(option.id, { name: event.target.value })}
                      />
                    </DetailField>
                    <DetailField label="Description">
                      <TextAreaField
                        label={`Description of ${option.name}`}
                        rows={3}
                        maxLength={2000}
                        value={option.description ?? ""}
                        placeholder="What it means for this character"
                        onChange={(event) => setOption(option.id, { description: event.target.value })}
                      />
                    </DetailField>
                    <DetailField label="Image link">
                      <Field
                        label={`Image link for ${option.name}`}
                        size="sm"
                        type="url"
                        inputMode="url"
                        maxLength={2048}
                        value={option.art ?? ""}
                        placeholder="https://"
                        onChange={(event) => setOption(option.id, { art: event.target.value })}
                      />
                    </DetailField>
                    <DetailField label="What it grants">
                      <Field
                        label={`What ${option.name} grants`}
                        size="sm"
                        maxLength={500}
                        value={option.grants ?? ""}
                        placeholder="Written out, for the table to apply"
                        onChange={(event) => setOption(option.id, { grants: event.target.value })}
                      />
                    </DetailField>
                  </>
                }
              />
            ))}
            {block.options.length < 50 && (
              <AddRow
                label="Option"
                placeholder={block.options.length ? "Another option" : "Write your first option"}
                onAdd={(name) => set({ options: [...block.options, { id: mintId("o"), name }] })}
              />
            )}
            {!block.options.length && <ConfigHint>Options are yours to write, the app ships no catalogue.</ConfigHint>}
          </div>
        </>
      )}
    </>
  );
}
