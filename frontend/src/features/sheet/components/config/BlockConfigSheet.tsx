"use client";

import BlockIcon, { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import PillButton from "@/shared/components/ui/PillButton";
import { BLOCK_TYPE_LABEL } from "../../data/blockPresets";
import { BLOCK_ICON_KEYS, type BlockDensity, type SheetBlock } from "../../types";
import { iconName } from "../../utils/blocks";
import { SectionLabel } from "../controls/Field";
import Segmented from "../controls/Segmented";
import Toggle from "../controls/Toggle";
import ChoiceConfig from "./ChoiceConfig";
import ListConfig from "./ListConfig";
import ResourceConfig from "./ResourceConfig";
import StatSetConfig from "./StatSetConfig";
import TextConfig from "./TextConfig";
import styles from "./BlockConfigSheet.module.css";

type BlockConfigSheetProps = {
  block: SheetBlock;
  onChange: (block: SheetBlock) => void;
  onRemove: () => void;
  onDone: () => void;
};

/**
 * Configure one block (design `BlockConfigSheet`, frames 03.3 and 03.4; plan M0 C1): title, icon,
 * pin, width, and the type's own settings. Every change applies at once; Done closes the sheet.
 */
export default function BlockConfigSheet({ block, onChange, onRemove, onDone }: BlockConfigSheetProps) {
  const set = (patch: Partial<SheetBlock>) => onChange({ ...block, ...patch } as SheetBlock);

  return (
    <div className={styles.config}>
      <div className={styles.header}>
        <BlockIconBox icon={block.icon} size={40} />
        <input
          className={styles.title}
          type="text"
          value={block.title}
          aria-label="Block title"
          maxLength={80}
          onChange={(event) => set({ title: event.target.value })}
        />
        <span className={styles.type}>{BLOCK_TYPE_LABEL[block.type]}</span>
      </div>

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

        <div className={styles.card}>
          <div className={styles.cardCopy}>
            <p className={styles.cardTitle}>Pin to quick access</p>
            <p className={styles.cardBody}>Reachable on the sheet without opening a tab</p>
          </div>
          <Toggle on={block.pinned} onChange={(pinned) => set({ pinned })} label="Pin to quick access" />
        </div>

        {/* WAITING ON DESIGN: 5 - Blocks draws density. Phone ignores it; wide pairs half blocks. */}
        <SectionLabel>Width on wide screens</SectionLabel>
        <Segmented<BlockDensity>
          label="Width on wide screens"
          options={[
            ["full", "Full"],
            ["half", "Half"],
          ]}
          value={block.density}
          onChange={(density) => set({ density })}
        />

        {block.type === "choice" && <ChoiceConfig block={block} onChange={onChange} />}
        {block.type === "stats" && <StatSetConfig block={block} onChange={onChange} />}
        {block.type === "resource" && <ResourceConfig block={block} onChange={onChange} />}
        {block.type === "list" && <ListConfig block={block} onChange={onChange} />}
        {block.type === "text" && <TextConfig block={block} onChange={onChange} />}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.remove} onClick={onRemove}>
          <BlockIcon icon="trash" size={16} />
          Remove block
        </button>
        <div className={styles.done}>
          <PillButton onClick={onDone}>Done</PillButton>
        </div>
      </div>
    </div>
  );
}
