import type { TextBlock } from "../../types";
import { SectionLabel, TextAreaField } from "../controls/Field";
import Toggle from "../controls/Toggle";
import styles from "./TypeConfig.module.css";

/** A Text block's settings: the body, plain text with paragraphs (plan M0 B5). */
export default function TextConfig({ block, onChange }: { block: TextBlock; onChange: (block: TextBlock) => void }) {
  return (
    <>
      <SectionLabel>Body</SectionLabel>
      <TextAreaField
        label="Body"
        rows={6}
        value={block.body}
        maxLength={50000}
        placeholder="Write freely. Line breaks become paragraphs."
        onChange={(event) => onChange({ ...block, body: event.target.value })}
      />
      {/* WAITING ON DESIGN: 5 - Blocks. The model keeps whether a Text block starts closed. */}
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Start closed on the sheet</span>
        <Toggle
          on={block.collapsed}
          onChange={(collapsed) => onChange({ ...block, collapsed })}
          label="Start closed on the sheet"
        />
      </div>
    </>
  );
}
