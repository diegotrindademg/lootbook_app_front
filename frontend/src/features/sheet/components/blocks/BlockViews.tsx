"use client";

import { useState } from "react";
import BlockIcon, { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import type { ChoiceBlock, ListBlock, ResourceBlock, SheetBlock, StatSetBlock, TextBlock } from "../../types";
import { resetNote } from "../../utils/blocks";
import { formatDerived } from "../../utils/derived";
import { Gauge, Pips, StepButton } from "./ResourceParts";
import styles from "./BlockViews.module.css";

/** Changes a resource at the table: set tier `tier` of `block` to `next`. Absent on a read-only sheet. */
export type SetResource = (block: ResourceBlock, tier: number, next: number) => void;

/** Refills a Manual or Custom resource to its maximum (Figma page 6 Flow 12; contract v1.1, 9). */
export type ResetResource = (block: ResourceBlock) => void;

/** One block as it shows on the sheet (design `BlockView`). */
export default function BlockView({
  block,
  onSetResource,
  onResetResource,
}: {
  block: SheetBlock;
  onSetResource?: SetResource;
  onResetResource?: ResetResource;
}) {
  switch (block.type) {
    case "stats":
      return <StatSetView block={block} />;
    case "resource":
      return <ResourceView block={block} onSetResource={onSetResource} onResetResource={onResetResource} />;
    case "list":
      return <ListView block={block} />;
    case "text":
      return <TextView block={block} />;
    case "choice":
      return <ChoiceView block={block} />;
  }
}

/** Design `StatSetBlock`: three columns of cards, the number, and the derived value's pill. */
function StatSetView({ block }: { block: StatSetBlock }) {
  if (!block.entries.length) return <p className={styles.empty}>No values yet.</p>;
  return (
    <ul className={styles.statGrid}>
      {block.entries.map((entry) => {
        const derived = entry.derived ? formatDerived(entry.derived.value, entry.derived.signed) : "";
        return (
          <li key={entry.localId} className={styles.statCard}>
            <span className={styles.statAbbr} aria-hidden="true">
              {entry.abbr || entry.name}
            </span>
            <span className={styles.statValue}>
              <span className={styles.hidden}>{entry.name || entry.abbr} </span>
              {entry.value ?? "–"}
            </span>
            {derived ? (
              <span className={styles.derivedPill}>
                <span className={styles.hidden}>, derived </span>
                {derived}
              </span>
            ) : (
              <span className={styles.derivedSpacer} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Design `ResourceBlock`: counter, pips, tiered slots or gauge, with minus and plus at the table. */
function ResourceView({
  block,
  onSetResource,
  onResetResource,
}: {
  block: ResourceBlock;
  onSetResource?: SetResource;
  onResetResource?: ResetResource;
}) {
  const tier = block.tiers[0];
  // Each session resources refill from the strip's New session; Manual and Custom ones from here.
  const canReset = onResetResource && block.reset.mode !== "session";
  const full = block.tiers.every((t) => t.max <= 0 || t.current >= t.max);
  const note = (
    <span className={styles.resetLine}>
      <span className={styles.resetNote}>{resetNote(block.reset)}</span>
      {canReset && (
        <button
          type="button"
          className={styles.resetLink}
          aria-label={`Reset ${block.title}`}
          disabled={full}
          onClick={() => onResetResource(block)}
        >
          Reset
        </button>
      )}
    </span>
  );
  const steps = tier && onSetResource && (
    <div className={styles.steps}>
      <StepButton
        kind="minus"
        label={`Spend one ${block.title}`}
        disabled={tier.current <= 0}
        onClick={() => onSetResource(block, 0, tier.current - 1)}
      />
      <StepButton
        kind="plus"
        label={`Add one ${block.title}`}
        disabled={tier.max ? tier.current >= tier.max : false}
        onClick={() => onSetResource(block, 0, tier.current + 1)}
      />
    </div>
  );

  return (
    <section className={styles.card} aria-label={block.title}>
      <div className={styles.resourceHead}>
        <span className={styles.resourceTitle}>{block.title}</span>
        {block.model !== "tiered" && tier && (
          <span className={styles.readout} aria-live="polite">
            {tier.current}
            {tier.max ? <span className={styles.readoutMax}> / {tier.max}</span> : null}
          </span>
        )}
      </div>
      {block.model === "gauge" && tier && (
        <>
          <Gauge current={tier.current} max={tier.max} />
          <div className={styles.row}>
            {note}
            {steps}
          </div>
        </>
      )}
      {block.model === "pips" && tier && (
        <>
          <Pips
            label={block.title}
            current={tier.current}
            max={tier.max}
            onSet={onSetResource && ((next) => onSetResource(block, 0, next))}
          />
          {note}
        </>
      )}
      {block.model === "tiered" && (
        <div className={styles.tiers}>
          {block.tiers.map((t, index) => (
            <div key={t.localId} className={styles.tier}>
              <span className={styles.tierLabel}>{t.label}</span>
              <Pips
                label={`${block.title} ${t.label}`}
                current={t.current}
                max={t.max}
                size={16}
                gap={6}
                onSet={onSetResource && ((next) => onSetResource(block, index, next))}
              />
            </div>
          ))}
          {note}
        </div>
      )}
      {block.model === "counter" && (
        <div className={styles.row}>
          {note}
          {steps}
        </div>
      )}
    </section>
  );
}

/**
 * Design `ListBlock`: rows with a name, a note ("Uses <attribute>" when there is none), and a value
 * pill. The trained mark shows here and is changed in the editor (decided Oct 25: no document write
 * during play).
 */
function ListView({ block }: { block: ListBlock }) {
  if (!block.rows.length) return <p className={styles.empty}>No items yet.</p>;
  return (
    <ul className={styles.list}>
      {block.rows.map((row) => {
        const note = row.note || (row.attribute ? `Uses ${row.attribute}` : "");
        return (
          <li key={row.id} className={styles.listRow}>
            {block.showIcons ? (
              <BlockIconBox icon={row.icon ?? block.icon} size={32} />
            ) : row.trained !== undefined ? (
              <span className={row.trained ? `${styles.check} ${styles.checked}` : styles.check}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {row.trained && <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                <span className={styles.hidden}>{row.trained ? "Trained" : "Not trained"}</span>
              </span>
            ) : null}
            <span className={styles.listCopy}>
              <span className={styles.listName}>{row.name}</span>
              {note && <span className={styles.listNote}>{note}</span>}
            </span>
            {row.value && <span className={styles.valuePill}>{row.value}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Design `TextBlock`: a card that opens and closes; line breaks are paragraphs. */
function TextView({ block }: { block: TextBlock }) {
  const [open, setOpen] = useState(!block.collapsed);
  const paragraphs = block.body.split("\n").filter((line) => line.trim());
  const bodyId = `text-${block.id}`;
  return (
    <section className={styles.textCard}>
      <button type="button" className={styles.textHead} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(!open)}>
        <span className={styles.textTitle}>{block.title}</span>
        <span className={open ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}>
          <BlockIcon icon="chevronDown" size={18} />
        </span>
      </button>
      {open && (
        <div className={styles.textBody} id={bodyId}>
          {paragraphs.length ? (
            paragraphs.map((line, index) => <p key={index}>{line}</p>)
          ) : (
            <p className={styles.nothing}>Nothing written yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

/** Design `ChoiceBlock`: one card per picked option, its art under a gradient; free text as prose. */
function ChoiceView({ block }: { block: ChoiceBlock }) {
  if (block.mode === "text") {
    const text = typeof block.value === "string" ? block.value.trim() : "";
    return <p className={text ? styles.prose : `${styles.prose} ${styles.nothing}`}>{text || "Nothing entered yet."}</p>;
  }
  const ids = Array.isArray(block.value) ? block.value : block.value ? [block.value] : [];
  const chosen = ids.map((id) => block.options.find((o) => o.id === id)).filter((o) => o !== undefined);
  if (!chosen.length) return <p className={styles.empty}>No option picked.</p>;
  return (
    <ul className={styles.list}>
      {chosen.map((option) => (
        <li key={option.id} className={styles.optionCard}>
          {option.art && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- a link the user typed, any host */}
              <img className={styles.optionArt} src={option.art} alt="" />
              <span className={styles.optionShade} aria-hidden="true" />
            </>
          )}
          <span className={option.art ? `${styles.optionCopy} ${styles.optionCopyArt}` : styles.optionCopy}>
            <span className={styles.optionName}>{option.name}</span>
            {option.description && <span className={styles.optionDescription}>{option.description}</span>}
            {option.grants && <span className={styles.optionDescription}>{option.grants}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
