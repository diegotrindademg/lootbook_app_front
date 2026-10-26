"use client";

import { useRef, useState } from "react";
import BlockIcon from "@/shared/components/ui/BlockIcon";
import type { DerivedEntry, FillMethod, Rounding, StatEntry, StatSetBlock } from "../../types";
import { computeDerived, DEFAULT_DERIVED_FORMULA, describeFormula, formatDerived } from "../../utils/derived";
import {
  DEFAULT_ARRAY,
  DEFAULT_POOL,
  DEFAULT_ROLL,
  describeRoll,
  describeRolled,
  parseRoll,
  poolSettings,
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
import { ConfigHint, DetailField, LimitHint, ToggleCard } from "./ConfigRows";
import SubSheet from "./SubSheet";
import styles from "./TypeConfig.module.css";

type Props = { block: StatSetBlock; onChange: (block: StatSetBlock) => void };

function numberOrNull(text: string) {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? Math.max(-9999, Math.min(9999, n)) : null;
}

/**
 * A Stat set's settings (Figma page 5, T1 to T19, picks T12 A and T14 A): the fill method and its
 * settings, the values (name, short name, number), and the derived values, each on one value, in an
 * order the user sets.
 */
export default function StatSetConfig({ block, onChange }: Props) {
  const set = (patch: Partial<StatSetBlock>) => onChange({ ...block, ...patch });
  const setEntry = (localId: string, patch: Partial<StatEntry>) =>
    set({ entries: block.entries.map((entry) => (entry.localId === localId ? { ...entry, ...patch } : entry)) });
  const [rolled, setRolled] = useState<Record<string, string>>({});

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
      {block.fill === "pool" && <PoolSettings block={block} onChange={onChange} />}
      {block.fill === "array" && <ArraySettings block={block} onChange={onChange} />}
      {block.fill === "roll" && <RollSettings block={block} onChange={onChange} onRolled={setRolled} />}

      <SectionLabel>Values</SectionLabel>
      <div className={styles.stack}>
        {block.entries.map((entry, index) => (
          <EntryRow
            key={entry.localId}
            block={block}
            entry={entry}
            position={index + 1}
            rolled={block.fill === "roll" ? rolled[entry.localId] : undefined}
            onChange={(patch) => setEntry(entry.localId, patch)}
            onRemove={() => set({ entries: block.entries.filter((e) => e.localId !== entry.localId) })}
          />
        ))}
        {!block.entries.length && <ConfigHint>No values yet.</ConfigHint>}
        <LimitHint count={block.entries.length} max={40} noun="values" />
        {block.entries.length < 40 && (
          <GhostPill
            wide
            onClick={() =>
              set({
                entries: [...block.entries, { key: null, localId: mintId("e"), name: "", abbr: "", value: 10, derived: null }],
              })
            }
          >
            + Add value
          </GhostPill>
        )}
      </div>

      <DerivedValues block={block} onChange={onChange} />
    </>
  );
}

function EntryRow({
  block,
  entry,
  position,
  rolled,
  onChange,
  onRemove,
}: {
  block: StatSetBlock;
  entry: StatEntry;
  position: number;
  rolled?: string;
  onChange: (patch: Partial<StatEntry>) => void;
  onRemove: () => void;
}) {
  const label = entry.name.trim() || `Value ${position}`;
  const errorId = `entry-error-${entry.localId}`;
  let error = "";
  if (block.fill === "pool" && entry.value !== null) {
    const { min, max } = poolSettings(block);
    if (entry.value > max) error = `Highest is ${max} in this pool`;
    else if (entry.value < min) error = `Lowest is ${min} in this pool`;
  }

  let number: React.ReactNode;
  if (block.fill === "array") {
    const values = Array.isArray(block.fillConfig?.values) ? (block.fillConfig.values as number[]) : DEFAULT_ARRAY;
    const free = unusedArrayValues(values, block.entries);
    const own = entry.value !== null && values.includes(entry.value) ? [entry.value] : [];
    const choices = [...new Set([...own, ...free])].sort((a, b) => b - a);
    number = (
      <select
        className={styles.select}
        aria-label={`${label} value`}
        value={own.length ? String(entry.value) : ""}
        onChange={(event) => onChange({ value: event.target.value === "" ? null : Number(event.target.value) })}
      >
        <option value="">Pick</option>
        {choices.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  } else {
    number = (
      <Field
        label={`${label} value`}
        align="center"
        type="number"
        inputMode="numeric"
        value={entry.value ?? ""}
        placeholder="0"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        className={error ? styles.invalid : undefined}
        onChange={(event) => onChange({ value: numberOrNull(event.target.value) })}
      />
    );
  }

  return (
    <div className={styles.entry}>
      <div className={block.fill === "array" ? `${styles.valuesRow} ${styles.valuesRowWide}` : styles.valuesRow}>
        <Field
          label={`Name of value ${position}`}
          value={entry.name}
          placeholder="Name"
          maxLength={120}
          onChange={(event) => {
            const name = event.target.value;
            // The short name follows the name until the user writes their own.
            const followsName = !entry.abbr || entry.abbr === abbreviate(entry.name);
            onChange(followsName ? { name, abbr: abbreviate(name) } : { name });
          }}
        />
        <Field
          label={`Short name of ${label}`}
          align="center"
          value={entry.abbr}
          placeholder="ABR"
          maxLength={6}
          onChange={(event) => onChange({ abbr: event.target.value.toUpperCase().slice(0, 6) })}
        />
        {number}
        <RoundButton icon="close" label={`Remove ${label}`} onClick={onRemove} />
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
      {rolled && <p className={styles.preview}>{rolled}</p>}
    </div>
  );
}

/** Figma page 5, T4 to T6: Total, Lowest, Highest, and the points left; over the pool blocks Done. */
function PoolSettings({ block, onChange }: Props) {
  const { total, min, max } = poolSettings(block);
  const spent = poolSpent(block.entries, min);
  const over = spent - total;
  const setConfig = (key: "total" | "min" | "max", text: string) =>
    onChange({ ...block, fillConfig: { total, min, max, [key]: numberOrNull(text) ?? 0 } });
  return (
    <>
      <SectionLabel>Point pool</SectionLabel>
      <div className={styles.fillGrid}>
        {(
          [
            ["total", "Total", total],
            ["min", "Lowest", min],
            ["max", "Highest", max],
          ] as const
        ).map(([key, text, value]) => (
          <DetailField key={key} label={text}>
            <Field label={text} type="number" inputMode="numeric" value={value} onChange={(event) => setConfig(key, event.target.value)} />
          </DetailField>
        ))}
      </div>
      <div className={over > 0 ? `${styles.poolCard} ${styles.poolOver}` : styles.poolCard} role="status">
        <div className={styles.poolCopy}>
          <p className={styles.poolTitle}>{over > 0 ? `${over} over the pool` : "Points left"}</p>
          <p className={styles.poolBody}>{over > 0 ? "Lower a value to save this block" : "One point per step above the lowest"}</p>
        </div>
        <span className={styles.poolNumber}>{over > 0 ? `${spent} of ${total}` : `${total - spent} of ${total}`}</span>
      </div>
    </>
  );
}

/** Figma page 5, T7 to T9: numbers to place, each once, and a picker on each value. */
function ArraySettings({ block, onChange }: Props) {
  const values = Array.isArray(block.fillConfig?.values) ? (block.fillConfig.values as number[]) : DEFAULT_ARRAY;
  const free = unusedArrayValues(values, block.entries);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // The first value with no number from the array (or one another value already holds) gets it.
  const place = (n: number) => {
    const counts = new Map<number, number>();
    const target = block.entries.find((entry) => {
      if (entry.value === null || !values.includes(entry.value)) return true;
      const seen = (counts.get(entry.value) ?? 0) + 1;
      counts.set(entry.value, seen);
      return seen > values.filter((v) => v === entry.value).length;
    });
    if (target) onChange({ ...block, entries: block.entries.map((e) => (e.localId === target.localId ? { ...e, value: n } : e)) });
  };

  const add = () => {
    const n = numberOrNull(draft);
    if (n !== null) onChange({ ...block, fillConfig: { values: [...values, n].slice(0, 40) } });
    setDraft("");
    setAdding(false);
  };

  const freeLeft = free.slice();
  return (
    <>
      <SectionLabel>Numbers to place</SectionLabel>
      <div className={styles.numberChips}>
        {values.map((n, i) => {
          const at = freeLeft.indexOf(n);
          const isFree = at >= 0;
          if (isFree) freeLeft.splice(at, 1);
          return (
            <button
              key={i}
              type="button"
              className={isFree ? `${styles.numberChip} ${styles.numberFree}` : `${styles.numberChip} ${styles.numberUsed}`}
              aria-disabled={!isFree || undefined}
              aria-label={isFree ? `Place ${n}` : `${n}, placed`}
              onClick={() => isFree && place(n)}
            >
              {n}
            </button>
          );
        })}
        {adding ? (
          <input
            className={styles.numberInput}
            aria-label="Add a number"
            type="number"
            inputMode="numeric"
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onBlur={add}
            onKeyDown={(event) => {
              if (event.key === "Enter") add();
              if (event.key === "Escape") {
                event.stopPropagation();
                setDraft("");
                setAdding(false);
              }
            }}
          />
        ) : (
          <button type="button" className={`${styles.numberChip} ${styles.numberAdd}`} aria-label="Add a number" onClick={() => setAdding(true)}>
            +
          </button>
        )}
      </div>
      {values.length < block.entries.length ? (
        <p className={styles.fieldError}>{`Add numbers: ${block.entries.length} values, ${values.length} numbers`}</p>
      ) : (
        <ConfigHint>Tap a free number above, or the field to choose from a list. Each number is used once.</ConfigHint>
      )}
    </>
  );
}

/** Figma page 5, T10 to T12 A: one formula, Roll all values, and what each value rolled. */
function RollSettings({ block, onChange, onRolled }: Props & { onRolled: (rolled: Record<string, string>) => void }) {
  const formula = typeof block.fillConfig?.formula === "string" ? block.fillConfig.formula : DEFAULT_ROLL;
  const roll = parseRoll(formula);
  const [rolledOnce, setRolledOnce] = useState(false);
  return (
    <>
      <DetailField label="Dice for each value">
        <Field
          label="Dice for each value"
          value={formula}
          maxLength={20}
          aria-invalid={!roll || undefined}
          className={roll ? undefined : styles.invalid}
          onChange={(event) => onChange({ ...block, fillConfig: { formula: event.target.value } })}
        />
        {roll ? <ConfigHint>{describeRoll(roll)}</ConfigHint> : <p className={styles.fieldError}>Write it as 4d6, 4d6k3 or 2d6+6</p>}
      </DetailField>
      <GhostPill
        wide
        disabled={!roll || !block.entries.length}
        onClick={() => {
          if (!roll) return;
          const lines: Record<string, string> = {};
          const entries = block.entries.map((entry) => {
            const result = rollOnce(roll);
            lines[entry.localId] = describeRolled(result.kept, result.dropped);
            return { ...entry, value: result.total };
          });
          onRolled(lines);
          setRolledOnce(true);
          onChange({ ...block, fillConfig: { formula }, entries });
        }}
      >
        {rolledOnce ? "Roll all values again" : "Roll all values"}
      </GhostPill>
    </>
  );
}

const ROUNDING_OPTIONS: [Rounding, string][] = [
  ["floor", "Down"],
  ["ceil", "Up"],
  ["round", "Nearest"],
  ["none", "None"],
];

/**
 * Figma page 5, T13 to T19 (T14 A): the derived values of the set, in their order, each worked out
 * from one value. The pen opens the derived value editor; the grip moves one by drag or by the up
 * and down arrows. A derived value's name shows here only; the sheet shows its value.
 */
function DerivedValues({ block, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const withDerived = block.entries.filter((entry) => entry.derived).sort((a, b) => a.derived!.order - b.derived!.order);
  const free = block.entries.filter((entry) => !entry.derived);

  const setDerived = (localId: string, derived: DerivedEntry | null) =>
    onChange({ ...block, entries: block.entries.map((e) => (e.localId === localId ? { ...e, derived } : e)) });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= withDerived.length || to === from) return;
    const order = withDerived.map((e) => e.localId);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    onChange({
      ...block,
      entries: block.entries.map((e) => (e.derived ? { ...e, derived: { ...e.derived, order: order.indexOf(e.localId) } } : e)),
    });
    setAnnouncement(`${withDerived[from].derived!.label} moved to ${to + 1} of ${order.length}`);
    window.setTimeout(() => listRef.current?.querySelector<HTMLElement>(`[data-derived-grip="${moved}"]`)?.focus());
  };

  const add = () => {
    const entry = free[0];
    if (!entry) return;
    setDerived(entry.localId, {
      key: null,
      label: `${entry.name.trim() || "Value"} modifier`,
      order: withDerived.length,
      signed: true,
      ...DEFAULT_DERIVED_FORMULA,
      value: null,
    });
    setEditing(entry.localId);
  };

  // Moving a derived value to another value ("Based on") keeps its name, formula and order.
  const rebase = (from: string, to: string) => {
    const source = block.entries.find((e) => e.localId === from);
    if (!source?.derived || from === to) return;
    onChange({
      ...block,
      entries: block.entries.map((e) =>
        e.localId === from ? { ...e, derived: null } : e.localId === to ? { ...e, derived: { ...source.derived!, key: null } } : e,
      ),
    });
    setEditing(to);
  };

  const editingEntry = editing ? block.entries.find((e) => e.localId === editing && e.derived) : undefined;

  return (
    <>
      <SectionLabel>Derived values</SectionLabel>
      {withDerived.length > 0 && (
        <ul className={styles.derivedList} ref={listRef}>
          {withDerived.map((entry, index) => {
            const derived = entry.derived!;
            const value = formatDerived(computeDerived(entry.value, derived), derived.signed);
            return (
              <li key={entry.localId} className={styles.derivedRow}>
                <button
                  type="button"
                  className={styles.derivedGrip}
                  data-derived-grip={entry.localId}
                  aria-label={`Move ${derived.label}, ${index + 1} of ${withDerived.length}`}
                  aria-describedby="derived-move-help"
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      move(index, index - 1);
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault();
                      move(index, index + 1);
                    }
                  }}
                  onPointerDown={(event) => {
                    const startY = event.clientY;
                    const target = event.currentTarget;
                    const pitch = (target.closest("li")?.getBoundingClientRect().height ?? 58) + 8;
                    target.setPointerCapture(event.pointerId);
                    const up = (e: PointerEvent) => {
                      target.removeEventListener("pointerup", up);
                      const to = Math.max(0, Math.min(withDerived.length - 1, index + Math.round((e.clientY - startY) / pitch)));
                      move(index, to);
                    };
                    target.addEventListener("pointerup", up);
                  }}
                >
                  <BlockIcon icon="grip" size={18} strokeWidth={2.5} />
                </button>
                <span className={styles.derivedCopy}>
                  <span className={styles.derivedName}>{derived.label}</span>
                  <span className={styles.derivedSummary}>{describeFormula(entry.name.trim(), derived)}</span>
                </span>
                {value && <span className={styles.previewValue}>{value}</span>}
                <button type="button" className={styles.penButton} aria-label={`Edit ${derived.label}`} onClick={() => setEditing(entry.localId)}>
                  <BlockIcon icon="pen" size={14} />
                </button>
                <RoundButton icon="close" label={`Remove ${derived.label}`} onClick={() => setDerived(entry.localId, null)} />
              </li>
            );
          })}
        </ul>
      )}
      <p id="derived-move-help" className={styles.hiddenText}>
        Drag, or press the up or down arrow, to change the order.
      </p>
      <p className={styles.hiddenText} role="status" aria-live="polite">
        {announcement}
      </p>
      {free.length > 0 && block.entries.length > 0 ? (
        <GhostPill wide onClick={add}>
          + Add derived value
        </GhostPill>
      ) : block.entries.length ? (
        <ConfigHint>Each value can have one derived value.</ConfigHint>
      ) : (
        <ConfigHint>Add a value first.</ConfigHint>
      )}

      {editingEntry && (
        <DerivedEditor
          block={block}
          entry={editingEntry}
          onChange={(derived) => setDerived(editingEntry.localId, derived)}
          onRebase={(to) => rebase(editingEntry.localId, to)}
          onRemove={() => {
            setEditing(null);
            setDerived(editingEntry.localId, null);
          }}
          onDone={() => setEditing(null)}
        />
      )}
    </>
  );
}

/** Figma page 5, T14 A: Name, Based on, Times, Then add, Rounding, Show a sign, and the preview. */
function DerivedEditor({
  block,
  entry,
  onChange,
  onRebase,
  onRemove,
  onDone,
}: {
  block: StatSetBlock;
  entry: StatEntry;
  onChange: (derived: DerivedEntry) => void;
  onRebase: (localId: string) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const derived = entry.derived!;
  const [times, setTimes] = useState(String(derived.multiplier));
  const [plus, setPlus] = useState(String(derived.offset));
  const set = (patch: Partial<DerivedEntry>) => onChange({ ...derived, ...patch });
  const timesBad = times.trim() === "" || !Number.isFinite(Number(times));
  const plusBad = plus.trim() === "" || !Number.isFinite(Number(plus));
  const preview = computeDerived(entry.value, derived);
  const entryName = entry.name.trim() || entry.abbr || "This value";

  return (
    <SubSheet title={derived.label} kind="Derived value" removeLabel="Remove derived value" onRemove={onRemove} onDone={onDone}>
      <DetailField label="Name">
        <Field
          label="Name"
          value={derived.label}
          maxLength={80}
          aria-invalid={!derived.label.trim() || undefined}
          onChange={(event) => set({ label: event.target.value })}
        />
        {derived.label.trim() ? (
          <ConfigHint>Shown in configuration only; the sheet shows the value</ConfigHint>
        ) : (
          <p className={styles.fieldError}>A derived value needs a name</p>
        )}
      </DetailField>
      <DetailField label="Based on">
        <select
          className={`${styles.select} ${styles.selectWide}`}
          aria-label="Based on"
          value={entry.localId}
          onChange={(event) => onRebase(event.target.value)}
        >
          {block.entries
            .filter((e) => e.localId === entry.localId || !e.derived)
            .map((e, i) => (
              <option key={e.localId} value={e.localId}>
                {e.name.trim() || e.abbr || `Value ${i + 1}`}
              </option>
            ))}
        </select>
      </DetailField>
      <div className={styles.formulaPair}>
        <DetailField label="Times">
          <Field
            label="Times"
            inputMode="decimal"
            value={times}
            aria-invalid={timesBad || undefined}
            className={timesBad ? styles.invalid : undefined}
            onChange={(event) => {
              setTimes(event.target.value);
              const n = Number(event.target.value);
              if (event.target.value.trim() !== "" && Number.isFinite(n)) set({ multiplier: n });
            }}
          />
        </DetailField>
        <DetailField label="Then add">
          <Field
            label="Then add"
            inputMode="decimal"
            value={plus}
            aria-invalid={plusBad || undefined}
            className={plusBad ? styles.invalid : undefined}
            onChange={(event) => {
              setPlus(event.target.value);
              const n = Number(event.target.value);
              if (event.target.value.trim() !== "" && Number.isFinite(n)) set({ offset: n });
            }}
          />
        </DetailField>
      </div>
      {(timesBad || plusBad) && <p className={styles.fieldError}>Write a number, like 0.5 or -5</p>}
      <SectionLabel>Rounding</SectionLabel>
      <Segmented<Rounding> label="Rounding" options={ROUNDING_OPTIONS} value={derived.rounding} onChange={(rounding) => set({ rounding })} />
      <ToggleCard title="Show a sign" body="Writes +3 and -1, for modifiers" on={derived.signed} onChange={(signed) => set({ signed })} />
      <div className={styles.previewCard} aria-live="polite">
        <span>{entry.value === null ? `${entryName} has no number yet` : `${entryName} ${entry.value} gives`}</span>
        <span className={styles.previewCardValue}>{formatDerived(preview, derived.signed)}</span>
      </div>
    </SubSheet>
  );
}
