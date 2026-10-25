"use client";

import { useState } from "react";
import { useOverlayFocus } from "@/shared/hooks/useOverlayFocus";
import styles from "./Dialog.module.css";

type DialogFrameProps = {
  title: string;
  role: "dialog" | "alertdialog";
  onCancel: () => void;
  children: React.ReactNode;
};

function DialogFrame({ title, role, onCancel, children }: DialogFrameProps) {
  const ref = useOverlayFocus<HTMLDivElement>(onCancel);
  return (
    <div className={styles.overlay}>
      <div className={styles.scrim} onClick={onCancel} aria-hidden="true" />
      <div ref={ref} className={styles.dialog} role={role} aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks before an action (design 01.7). Focus starts on the safe choice. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <DialogFrame title={title} role="alertdialog" onCancel={onCancel}>
      {body && <p className={styles.body}>{body}</p>}
      <div className={styles.buttons}>
        <button
          type="button"
          className={destructive ? `${styles.confirm} ${styles.destructive}` : styles.confirm}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel} data-autofocus>
          {cancelLabel}
        </button>
      </div>
    </DialogFrame>
  );
}

type PromptDialogProps = {
  title: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/** One field, no trip to the editor (design 01.8). Confirm is off while the field is blank. */
export function PromptDialog({
  title,
  label,
  initialValue,
  placeholder,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const blank = !value.trim();

  return (
    <DialogFrame title={title} role="dialog" onCancel={onCancel}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (!blank) onConfirm(value.trim());
        }}
      >
        <label className={styles.fieldLabel} htmlFor="dialog-field">
          {label}
        </label>
        <input
          id="dialog-field"
          className={styles.field}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          data-autofocus
          autoComplete="off"
        />
        <div className={styles.buttons}>
          <button type="submit" className={styles.confirm} disabled={blank}>
            {confirmLabel}
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}
