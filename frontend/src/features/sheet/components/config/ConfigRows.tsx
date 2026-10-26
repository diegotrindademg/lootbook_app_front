"use client";

import { useState } from "react";
import Icon from "@/shared/components/ui/Icon";
import { Field } from "../controls/Field";
import GhostPill from "../controls/GhostPill";
import RoundButton from "../controls/RoundButton";
import Toggle from "../controls/Toggle";
import styles from "./ConfigRows.module.css";

type EditorRowProps = {
  /** The row's name; a button when the row can be picked. */
  name: string;
  picked?: boolean;
  onPick?: () => void;
  pickLabel?: string;
  trailing?: React.ReactNode;
  removeLabel: string;
  onRemove: () => void;
  /** Details opened under the row (waiting on design: 5 - Blocks). */
  details?: React.ReactNode;
  detailsLabel?: string;
  detailsId?: string;
};

/**
 * One option, item or tier in a configuration sheet (design `OptionEditor` and `ItemsEditor` rows:
 * padding 8px 8px 8px 14px, radius 14; a picked option has a teal border and a check).
 */
export function EditorRow({
  name,
  picked = false,
  onPick,
  pickLabel,
  trailing,
  removeLabel,
  onRemove,
  details,
  detailsLabel,
  detailsId,
}: EditorRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={picked ? `${styles.row} ${styles.picked}` : styles.row}>
      <div className={styles.line}>
        {onPick ? (
          <button
            type="button"
            className={styles.name}
            onClick={onPick}
            aria-pressed={picked}
            aria-label={pickLabel}
          >
            {name}
          </button>
        ) : (
          <span className={styles.name}>{name}</span>
        )}
        {trailing}
        {picked && <Icon name="check" size={18} className={styles.check} />}
        {details && (
          <RoundButton
            icon="chevronDown"
            label={detailsLabel ?? `Details of ${name}`}
            expanded={open}
            controls={detailsId}
            onClick={() => setOpen(!open)}
          />
        )}
        <RoundButton icon="close" label={removeLabel} onClick={onRemove} />
      </div>
      {details && open && (
        <div className={styles.details} id={detailsId}>
          {details}
        </div>
      )}
    </div>
  );
}

type AddRowProps = {
  placeholder: string;
  label: string;
  onAdd: (name: string) => void;
};

/** A field and an Add pill; Enter adds too. */
export function AddRow({ placeholder, label, onAdd }: AddRowProps) {
  const [value, setValue] = useState("");
  const add = () => {
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  };
  return (
    <div className={styles.add}>
      <Field
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          }
        }}
      />
      <GhostPill onClick={add} disabled={!value.trim()} ariaLabel={`Add ${label.toLowerCase()}`}>
        Add
      </GhostPill>
    </div>
  );
}

/** A quiet line of help under a section. */
export function ConfigHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}

/** A labelled field inside a row's details. */
export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.detailField}>
      <span className={styles.detailLabel} aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Figma "Config / Toggle row": a setting with a switch on a card, its line under it wrapping. */
export function ToggleCard({
  title,
  body,
  on,
  onChange,
}: {
  title: string;
  body?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className={styles.toggleCard}>
      <div className={styles.toggleCopy}>
        <p className={styles.toggleTitle}>{title}</p>
        {body && <p className={styles.toggleBody}>{body}</p>}
      </div>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

/** A quiet line saying a list is as long as it can be (the limits in sheet-document.md 2.6). */
export function LimitHint({ count, max, noun }: { count: number; max: number; noun: string }) {
  if (count < max) return null;
  return <p className={styles.hint}>{`${max} ${noun}, the most a block can hold.`}</p>;
}
