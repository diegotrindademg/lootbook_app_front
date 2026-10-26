"use client";

import BlockIcon, { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import PillButton from "@/shared/components/ui/PillButton";
import { BLOCK_TYPE_LABEL } from "../../data/blockPresets";
import { BLOCK_ICON_KEYS, type BlockDensity, type SheetBlock } from "../../types";
import { iconName } from "../../utils/blocks";
import { configProblem } from "../../utils/fillMethods";
import { SectionLabel } from "../controls/Field";
import Segmented from "../controls/Segmented";
import ChoiceConfig from "./ChoiceConfig";
import ListConfig from "./ListConfig";
import ResourceConfig from "./ResourceConfig";
import StatSetConfig from "./StatSetConfig";
import { ConfigHint, ToggleCard } from "./ConfigRows";
import TextConfig from "./TextConfig";
import styles from "./BlockConfigSheet.module.css";

type BlockConfigSheetProps = {
  block: SheetBlock;
  onChange: (block: SheetBlock) => void;
  onRemove: () => void;
  onDone: () => void;
  /** Every block of the character, for what one block offers from another (stat names). */
  siblings: SheetBlock[];
};

/**
 * Configure one block (design `BlockConfigSheet`, frames 03.3 and 03.4; plan M0 C1): title, icon,
 * pin, width, and the type's own settings. Every change applies at once; Done closes the sheet.
 */
export default function BlockConfigSheet({ block, onChange, onRemove, onDone, siblings }: BlockConfigSheetProps) {
  const statNames = siblings.flatMap((b) =>
    b.type === "stats" ? b.entries.map((entry) => entry.name.trim()).filter(Boolean) : [],
  );
  const set = (patch: Partial<SheetBlock>) => onChange({ ...block, ...patch } as SheetBlock);
  const titleMissing = !block.title.trim();
  const problem = configProblem(block);

  return (
    <div className={styles.config}>
      <div className={styles.header}>
        <BlockIconBox icon={block.icon} size={40} />
        <input
          className={titleMissing ? `${styles.title} ${styles.titleError}` : styles.title}
          type="text"
          value={block.title}
          aria-label="Block title"
          aria-invalid={titleMissing || undefined}
          aria-describedby={titleMissing ? "config-title-error" : undefined}
          maxLength={80}
          onChange={(event) => set({ title: event.target.value })}
        />
        <span className={styles.type}>{BLOCK_TYPE_LABEL[block.type]}</span>
        {/* Wide only (Figma BW1 A): the panel closes from its corner as well as from Done. */}
        <button type="button" className={styles.close} aria-label="Close" onClick={onDone} disabled={Boolean(problem)}>
          <Icon name="close" size={16} />
        </button>
      </div>
      {titleMissing && (
        <p id="config-title-error" className={styles.titleErrorText} role="alert">
          A block needs a title
        </p>
      )}

      <div className={styles.body}>
        <SectionLabel id="config-icon-label">Icon</SectionLabel>
        <div className={styles.icons} role="radiogroup" aria-labelledby="config-icon-label">
          {BLOCK_ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={key === block.icon}
              aria-label={iconName(key)}
              className={key === block.icon ? `${styles.icon} ${styles.iconOn}` : styles.icon}
              onClick={() => set({ icon: key })}
            >
              <BlockIcon icon={key} size={18} />
            </button>
          ))}
        </div>

        <ToggleCard
          title="Pin to quick access"
          body="Reachable on the sheet without opening a tab"
          on={block.pinned}
          onChange={(pinned) => set({ pinned })}
        />

        {/* Figma page 5, B7 A: density is shown on phone too. */}
        <SectionLabel>Density</SectionLabel>
        <Segmented<BlockDensity>
          label="Density"
          options={[
            ["full", "Full width"],
            ["half", "Half width"],
          ]}
          value={block.density}
          onChange={(density) => set({ density })}
        />
        <ConfigHint>Half pairs with the next half block in two columns on the sheet.</ConfigHint>

        {block.type === "choice" && <ChoiceConfig block={block} onChange={onChange} />}
        {block.type === "stats" && <StatSetConfig block={block} onChange={onChange} />}
        {block.type === "resource" && <ResourceConfig block={block} onChange={onChange} />}
        {block.type === "list" && <ListConfig block={block} onChange={onChange} statNames={[...new Set(statNames)]} />}
        {block.type === "text" && <TextConfig block={block} onChange={onChange} />}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.remove} onClick={onRemove}>
          <BlockIcon icon="trash" size={16} />
          Remove block
        </button>
        <div className={styles.done}>
          <PillButton onClick={onDone} disabled={Boolean(problem)}>
            Done
          </PillButton>
        </div>
      </div>
    </div>
  );
}
