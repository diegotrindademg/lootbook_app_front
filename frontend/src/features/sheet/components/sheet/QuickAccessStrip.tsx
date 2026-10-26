import BlockIcon from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import type { ResourceBlock, SheetBlock, StatSetBlock } from "../../types";
import { formatDerived } from "../../utils/derived";
import { pickedNames } from "../../utils/blocks";
import type { SetResource } from "../blocks/BlockViews";
import { Gauge, Pips, StepButton } from "../blocks/ResourceParts";
import styles from "./QuickAccessStrip.module.css";

/**
 * The pinned blocks, compact, on top of the raised panel (design `QuickAccessStrip`; M0 H3). Gauges
 * and stat sets get a full-width row (contract v1.1, 4); the rest share one row of up to three
 * tiles. Nothing pinned, no strip.
 */
export default function QuickAccessStrip({
  blocks,
  onSetResource,
  onNewSession,
}: {
  blocks: SheetBlock[];
  onSetResource?: SetResource;
  /** Figma page 6, Flow 12, option A: refill every Each session resource. Absent when read only. */
  onNewSession?: () => void;
}) {
  const pinned = blocks.filter((block) => block.pinned);
  if (!pinned.length) return null;
  const isWide = (block: SheetBlock) =>
    (block.type === "resource" && block.model === "gauge") || block.type === "stats";
  const wide = pinned.filter(isWide);
  const tiles = pinned.filter((block) => !isWide(block)).slice(0, 3);

  return (
    <section className={styles.strip} aria-labelledby="quick-access-title">
      <div className={styles.captionRow}>
        <h3 className={styles.caption} id="quick-access-title">
          <BlockIcon icon="pin" size={14} />
          Quick access
        </h3>
        {onNewSession && <NewSessionChip onClick={onNewSession} />}
      </div>
      {wide.map((block) =>
        block.type === "stats" ? (
          <StatsRow key={block.id} block={block} />
        ) : (
          <GaugeRow key={block.id} block={block as ResourceBlock} onSetResource={onSetResource} />
        ),
      )}
      {tiles.length > 0 && (
        <div className={styles.tiles}>
          {tiles.map((block) => (
            <Tile key={block.id} block={block} onSetResource={onSetResource} />
          ))}
        </div>
      )}
    </section>
  );
}

function GaugeRow({ block, onSetResource }: { block: ResourceBlock; onSetResource?: SetResource }) {
  const tier = block.tiers[0];
  if (!tier) return null;
  return (
    <div className={styles.gaugeRow}>
      <div className={styles.gaugeHead}>
        <span className={styles.gaugeTitle}>{block.title}</span>
        <span className={styles.gaugeReadout}>
          {tier.current}
          <span className={styles.max}> / {tier.max}</span>
        </span>
      </div>
      <div className={styles.gaugeLine}>
        {onSetResource && (
          <StepButton
            kind="minus"
            size={32}
            label={`Spend one ${block.title}`}
            disabled={tier.current <= 0}
            onClick={() => onSetResource(block, 0, tier.current - 1)}
          />
        )}
        <div className={styles.gaugeBar}>
          <Gauge current={tier.current} max={tier.max} height={10} />
        </div>
        {onSetResource && (
          <StepButton
            kind="plus"
            size={32}
            label={`Add one ${block.title}`}
            disabled={tier.current >= tier.max}
            onClick={() => onSetResource(block, 0, tier.current + 1)}
          />
        )}
      </div>
    </div>
  );
}

/** A pinned stat set: up to six values, the derived value when there is one, over the short name. */
function StatsRow({ block }: { block: StatSetBlock }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileCaption}>{block.title}</span>
      {block.entries.length ? (
        <ul className={styles.stats}>
          {block.entries.slice(0, 6).map((entry) => {
            const shown = entry.derived ? formatDerived(entry.derived.value, entry.derived.signed) : "";
            return (
              <li key={entry.localId} className={styles.stat}>
                <span className={styles.statValue}>{shown || (entry.value ?? "–")}</span>
                <span className={styles.statAbbr}>{entry.abbr || entry.name}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <span className={styles.tileText}>No values yet.</span>
      )}
    </div>
  );
}

function Tile({ block, onSetResource }: { block: SheetBlock; onSetResource?: SetResource }) {
  let body: React.ReactNode;
  if (block.type === "resource" && block.model === "pips") {
    const tier = block.tiers[0];
    // WAITING ON DESIGN: 6. The strip keeps its compact pips as a picture; minus and plus (44 targets) change
    // the value, so no target is smaller than 44 (L-26, Oct 26).
    body = tier && (
      <span className={styles.counter}>
        <Pips label={block.title} current={tier.current} max={tier.max} size={12} gap={5} />
        {onSetResource && (
          <span className={styles.counterSteps}>
            <StepButton
              kind="minus"
              size={26}
              label={`Spend one ${block.title}`}
              disabled={tier.current <= 0}
              onClick={() => onSetResource(block, 0, tier.current - 1)}
            />
            <StepButton
              kind="plus"
              size={26}
              label={`Add one ${block.title}`}
              disabled={tier.current >= tier.max}
              onClick={() => onSetResource(block, 0, tier.current + 1)}
            />
          </span>
        )}
      </span>
    );
  } else if (block.type === "resource" && block.model === "tiered") {
    const used = block.tiers.reduce((sum, t) => sum + t.current, 0);
    const total = block.tiers.reduce((sum, t) => sum + t.max, 0);
    body = (
      <span className={styles.tileNumber}>
        {used}
        <span className={styles.max}> / {total}</span>
      </span>
    );
  } else if (block.type === "resource") {
    const tier = block.tiers[0];
    body = tier && (
      <span className={styles.counter}>
        <span className={styles.tileNumber}>
          {tier.current}
          {tier.max ? <span className={styles.max}> / {tier.max}</span> : null}
        </span>
        {onSetResource && (
          <span className={styles.counterSteps}>
            <StepButton
              kind="minus"
              size={26}
              label={`Spend one ${block.title}`}
              disabled={tier.current <= 0}
              onClick={() => onSetResource(block, 0, tier.current - 1)}
            />
            <StepButton
              kind="plus"
              size={26}
              label={`Add one ${block.title}`}
              disabled={tier.max ? tier.current >= tier.max : false}
              onClick={() => onSetResource(block, 0, tier.current + 1)}
            />
          </span>
        )}
      </span>
    );
  } else if (block.type === "list") {
    body = (
      <span className={styles.tileNumber}>
        {block.rows.length}
        <span className={styles.itemsWord}> items</span>
      </span>
    );
  } else if (block.type === "choice") {
    const text = block.mode === "text" ? String(block.value ?? "") : pickedNames(block).join(", ");
    body = <span className={styles.choice}>{text || "–"}</span>;
  } else if (block.type === "text") {
    body = <span className={styles.tileText}>{block.body.split("\n")[0] || "–"}</span>;
  }
  return (
    <div className={styles.tile}>
      <span className={styles.tileCaption}>{block.title}</span>
      {body}
    </div>
  );
}

/** Figma page 6, Reset A: a chip in the strip's caption row that refills Each session resources. */
export function NewSessionChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.newSession}
      aria-label="New session, refill each-session resources"
      onClick={onClick}
    >
      <Icon name="undo" size={14} />
      New session
    </button>
  );
}
