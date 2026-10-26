import { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import type { SheetBlock } from "../../types";
import BlockView, { type ResetResource, type SetResource } from "../blocks/BlockViews";
import styles from "./BlockSections.module.css";

type BlockSectionsProps = {
  blocks: SheetBlock[];
  onSetResource?: SetResource;
  onResetResource?: ResetResource;
};

/** A rough height for a half block, to pack a run of them into two columns (Figma page 6 wide). */
function estimate(block: SheetBlock) {
  const heading = 42;
  switch (block.type) {
    case "stats":
      return heading + Math.max(1, Math.ceil(block.entries.length / 3)) * 108;
    case "resource":
      if (block.model === "tiered") return heading + 70 + block.tiers.length * 30;
      return heading + (block.model === "counter" ? 110 : 130);
    case "list":
      return heading + Math.max(1, block.rows.length) * 72;
    case "text":
      return heading + 60 + block.body.split("\n").length * 44;
    case "choice":
      return heading + 102;
  }
}

type Group = { kind: "full"; block: SheetBlock } | { kind: "pair"; left: SheetBlock[]; right: SheetBlock[] };

/**
 * Every block of the sheet, one after the other, each under its heading (Figma "H1 · Brakka · wide"
 * 2415:34098): a full block takes the 864 width; a run of half blocks fills two 428 columns, each
 * next one going to the shorter column (Attributes and Health side by side, Second Wind under Health).
 */
export default function BlockSections({ blocks, onSetResource, onResetResource }: BlockSectionsProps) {
  const groups: Group[] = [];
  for (const block of blocks) {
    if (block.density === "full") {
      groups.push({ kind: "full", block });
      continue;
    }
    let pair = groups[groups.length - 1];
    if (!pair || pair.kind !== "pair") {
      pair = { kind: "pair", left: [], right: [] };
      groups.push(pair);
    }
    const height = (column: SheetBlock[]) => column.reduce((sum, b) => sum + estimate(b) + 24, 0);
    (height(pair.left) <= height(pair.right) ? pair.left : pair.right).push(block);
  }

  const section = (block: SheetBlock) => (
    <section key={block.id} id={`block-${block.id}`} className={styles.section} aria-labelledby={`heading-${block.id}`}>
      <h2 className={styles.heading} id={`heading-${block.id}`}>
        <BlockIconBox icon={block.icon} size={32} />
        {block.title}
      </h2>
      <BlockView block={block} onSetResource={onSetResource} onResetResource={onResetResource} />
    </section>
  );

  return (
    <div className={styles.sections}>
      {groups.map((group) =>
        group.kind === "full" ? (
          section(group.block)
        ) : (
          <div key={[...group.left, ...group.right][0].id} className={styles.pair}>
            <div className={styles.column}>{group.left.map(section)}</div>
            <div className={styles.column}>{group.right.map(section)}</div>
          </div>
        ),
      )}
    </div>
  );
}
