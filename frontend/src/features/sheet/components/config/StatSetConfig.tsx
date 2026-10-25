"use client";

import { useState } from "react";
import type { DerivedEntry, FillMethod, Rounding, StatEntry, StatSetBlock } from "../../types";
import { computeDerived, DEFAULT_DERIVED_FORMULA, formatDerived } from "../../utils/derived";
import {
  DEFAULT_ARRAY,
  DEFAULT_POOL,
  DEFAULT_ROLL,
  parseArray,
  parseRoll,
  poolSpent,
  rollOnce,
  unusedArrayValues,
} from "../../utils/fillMethods";
import { mintId } from "../../utils/ids";
import { abbreviate } from "../../utils/sheetMapping";
import { Field, SectionLabel } from "../controls/Field";
import GhostPill from "../controls/GhostPill";
import RoundButton from "../controls/RoundButton";
import Segmented from "../controls/Segmented";
import Toggle from "../controls/Toggle";
import { ConfigHint, DetailField } from "./ConfigRows";
import styles from "./TypeConfig.module.css";

type Props = { block: StatSetBlock; onChange: (block: StatSetBlock) => void };

function numberOrNull(text: string) {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? Math.max(-9999, Math.min(9999, n)) : null;
}

/**
 * A Stat set's settings (design `EntriesEditor`): the fill method and the values grid (name,
 * abbreviation, number). Each value can carry one derived value, per entry only (contract v1.1, 11).
 */
export default function StatSetConfig({ block, onChange }: Props) {
  const set = (patch: Partial<StatSetBlock>) => onChange({ ...block, ...patch });
  const setEntry = (localId: string, patch: Partial<StatEntry>) =>
    set({ entries: block.entries.map((entry) => (entry.localId === localId ? { ...entry, ...patch } : entry)) });

  return (
    <>
      <SectionLabel>Fill method</SectionLabel>
      <Segmented<FillMethod>
        label="Fill method"
        options={[
          ["free", "Free"],
          ["pool", "Point pool"],
          ["array", "Array"],
          ["roll", "Roll"],
        ]}
        value={block.fill}
        onChange={(fill) =>
          set({
            fill,
            fillConfig:
              fill === "pool"
                ? { ...DEFAULT_POOL }
                : fill === "array"
                  ? { values: DEFAULT_ARRAY }
                  : fill === "roll"
                    ? { formula: DEFAULT_ROLL }
                    : null,
          })
        }
      />
      <FillSettings block={block} onChange={onChange} />

      <SectionLabel>Values</SectionLabel>
      <div className={styles.stack}>
        {block.entries.length > 0 && (
          <div className={styles.valuesHead} aria-hidden="true">
            <span>Name</span>
            <span>Short</span>
            <span>Value</span>
          </div>
        )}
        {block.entries.map((entry, index) => (
          <EntryRow
            key={entry.localId}
            entry={entry}
            position={index + 1}
            onChange={(patch) => setEntry(entry.localId, patch)}
            onRemove={() => set({ entries: block.entries.filter((e) => e.localId !== entry.localId) })}
          />
        ))}
        {block.entries.length < 40 && (
          <div>
            <GhostPill
              onClick={() =>
                set({
                  entries: [
                    ...block.entries,
                    { key: null, localId: mintId("e"), name: "", abbr: "", value: 10, derived: null },
                  ],
                })
              }
            >
              + Add value
            </GhostPill>
          </div>
        )}
      </div>
    </>
  );
}

function EntryRow({
  entry,
  position,
  onChange,
  onRemove,
}: {
  entry: StatEntry;
  position: number;
  onChange: (patch: Partial<StatEntry>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label = entry.name.trim() || `Value ${position}`;
  const detailsId = `entry-details-${entry.localId}`;

  return (
    <div className={styles.entry}>
      <div className={styles.valuesRow}>
        <Field
          label={`Name of value ${position}`}
          size="sm"
          value={entry.name}
          placeholder="Name"
          maxLength={120}
          onChange={(event) => {
            const name = event.target.value;
            // The abbreviation follows the name until the user writes their own.
            const followsName = !entry.abbr || entry.abbr === abbreviate(entry.name);
            onChange(followsName ? { name, abbr: abbreviate(name) } : { name });
          }}
        />
        <Field
          label={`Short name of ${label}`}
          size="sm"
          align="center"
          value={entry.abbr}
          placeholder="ABR"
          maxLength={6}
          onChange={(event) => onChange({ abbr: event.target.value.toUpperCase().slice(0, 6) })}
        />
        <Field
          label={`${label} value`}
          size="sm"
          align="center"
          type="number"
          inputMode="numeric"
          value={entry.value ?? ""}
          placeholder="0"
          onChange={(event) => onChange({ value: numberOrNull(event.target.value) })}
        />
        <RoundButton
          icon="chevronDown"
          label={`Derived value of ${label}`}
          expanded={open}
          controls={detailsId}
          onClick={() => setOpen(!open)}
        />
        <RoundButton icon="close" label={`Remove ${label}`} onClick={onRemove} />
      </div>
      {open && (
        <div className={styles.entryDetails} id={detailsId}>
          <DerivedSettings entry={entry} label={label} onChange={(derived) => onChange({ derived })} />
        </div>
      )}
    </div>
  );
}

const ROUNDING_OPTIONS: [Rounding, string][] = [
  ["floor", "Down"],
  ["ceil", "Up"],
  ["round", "Nearest"],
  ["none", "None"],
];

/**
 * WAITING ON DESIGN: 5 - Blocks draws the derived value entry. A derived value has a name and an
 * order (Kerley, Oct 25), and a formula the back end computes: the value times a number, plus a
 * number, rounded. Its name shows here only; the sheet's pill shows the value (contract v1.1, 7).
 */
function DerivedSettings({
  entry,
  label,
  onChange,
}: {
  entry: StatEntry;
  label: string;
  onChange: (derived: DerivedEntry | null) => void;
}) {
  const derived = entry.derived;
  if (!derived) {
    return (
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Derived value</span>
        <Toggle
          on={false}
          label={`Give ${label} a derived value`}
          onChange={() =>
            onChange({
              key: null,
              label: `${entry.name.trim() || "Value"} modifier`,
              order: 0,
              signed: true,
              ...DEFAULT_DERIVED_FORMULA,
              value: null,
            })
          }
        />
      </div>
    );
  }

  const set = (patch: Partial<DerivedEntry>) => onChange({ ...derived, ...patch });
  const preview = computeDerived(entry.value, derived);

  return (
    <>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Derived value</span>
        <Toggle on label={`Give ${label} a derived value`} onChange={() => onChange(null)} />
      </div>
      <DetailField label="Name">
        <Field
          label={`Name of the derived value of ${label}`}
          size="sm"
          maxLength={80}
          value={derived.label}
          onChange={(event) => set({ label: event.target.value })}
        />
      </DetailField>
      <div className={styles.formula}>
        <span>Value ×</span>
        <Field
          label="Times"
          size="sm"
          align="center"
          type="number"
          inputMode="decimal"
          step="any"
          value={derived.multiplier}
          onChange={(event) => set({ multiplier: numberOrNull(event.target.value) ?? 0 })}
        />
        <span>+</span>
        <Field
          label="Plus"
          size="sm"
          align="center"
          type="number"
          inputMode="decimal"
          step="any"
          value={derived.offset}
          onChange={(event) => set({ offset: numberOrNull(event.target.value) ?? 0 })}
        />
      </div>
      <DetailField label="Rounding">
        <Segmented<Rounding> label="Rounding" options={ROUNDING_OPTIONS} value={derived.rounding} onChange={(rounding) => set({ rounding })} />
      </DetailField>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show a plus sign</span>
        <Toggle on={derived.signed} label="Show a plus sign" onChange={(signed) => set({ signed })} />
      </div>
      <DetailField label="Order">
        <Field
          label="Order"
          size="sm"
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          value={derived.order}
          onChange={(event) => set({ order: Math.max(0, Math.min(999, Math.round(numberOrNull(event.target.value) ?? 0))) })}
        />
      </DetailField>
      <p className={styles.preview} aria-live="polite">
        {entry.value === null ? (
          "Give the value a number to see the result."
        ) : (
          <>
            {entry.value} gives <span className={styles.previewValue}>{formatDerived(preview, derived.signed)}</span>
          </>
        )}
      </p>
    </>
  );
}

/** WAITING ON DESIGN: 5 - Blocks draws how a point pool, an array and a roll work. */
function FillSettings({ block, onChange }: Props) {
  const config = block.fillConfig ?? {};
  const setConfig = (next: Record<string, number | string | number[]>) => onChange({ ...block, fillConfig: next });

  if (block.fill === "pool") {
    const total = typeof config.total === "number" ? config.total : DEFAULT_POOL.total;
    const min = typeof config.min === "number" ? config.min : DEFAULT_POOL.min;
    const max = typeof config.max === "number" ? config.max : DEFAULT_POOL.max;
    const spent = poolSpent(block.entries, min);
    const over = block.entries.filter((e) => e.value !== null && (e.value < min || e.value > max)).length;
    return (
      <>
        <div className={styles.fillGrid}>
          {(
            [
              ["total", "Points", total],
              ["min", "Lowest", min],
              ["max", "Highest", max],
            ] as const
          ).map(([key, text, value]) => (
            <DetailField key={key} label={text}>
              <Field
                label={text}
                size="sm"
                align="center"
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(event) => setConfig({ total, min, max, [key]: numberOrNull(event.target.value) ?? 0 })}
              />
            </DetailField>
          ))}
        </div>
        <p className={spent > total || over ? `${styles.preview} ${styles.over}` : styles.preview} aria-live="polite">
          {spent} of {total} points spent, {total - spent} left.
          {over > 0 && ` ${over} value${over === 1 ? " is" : "s are"} outside ${min} to ${max}.`}
        </p>
      </>
    );
  }

  if (block.fill === "array") {
    const values = Array.isArray(config.values) ? config.values : DEFAULT_ARRAY;
    const unused = unusedArrayValues(values, block.entries);
    return (
      <>
        <DetailField label="Values to give out">
          <Field
            label="Values to give out"
            size="sm"
            defaultValue={values.join(", ")}
            placeholder="15, 14, 13, 12, 10, 8"
            onBlur={(event) => setConfig({ values: parseArray(event.target.value) })}
          />
        </DetailField>
        <div className={styles.inline}>
          <ConfigHint>{unused.length ? `Not given yet: ${unused.join(", ")}` : "Every value is given out."}</ConfigHint>
          <GhostPill
            disabled={!block.entries.length}
            onClick={() =>
              onChange({
                ...block,
                fillConfig: { values },
                entries: block.entries.map((entry, i) => ({ ...entry, value: values[i] ?? entry.value })),
              })
            }
          >
            Give in order
          </GhostPill>
        </div>
      </>
    );
  }

  if (block.fill === "roll") {
    const formula = typeof config.formula === "string" ? config.formula : DEFAULT_ROLL;
    const roll = parseRoll(formula);
    return (
      <>
        <DetailField label="Dice for each value">
          <Field
            label="Dice for each value"
            size="sm"
            value={formula}
            placeholder="4d6k3"
            maxLength={20}
            onChange={(event) => setConfig({ formula: event.target.value })}
          />
        </DetailField>
        <div className={styles.inline}>
          <ConfigHint>{roll ? "4d6k3 keeps the highest 3 of 4 dice." : "Write it as 4d6, 4d6k3 or 2d6+6."}</ConfigHint>
          <GhostPill
            disabled={!roll || !block.entries.length}
            onClick={() =>
              roll &&
              onChange({
                ...block,
                fillConfig: { formula },
                entries: block.entries.map((entry) => ({ ...entry, value: rollOnce(roll) })),
              })
            }
          >
            Roll values
          </GhostPill>
        </div>
      </>
    );
  }

  return null;
}
