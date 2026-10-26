import type { TextBlock } from "../../types";
import { SectionLabel, TextAreaField } from "../controls/Field";
import { ToggleCard } from "./ConfigRows";

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
      <ToggleCard
        title="Start collapsed"
        body="The sheet shows the title until it is opened"
        on={block.collapsed}
        onChange={(collapsed) => onChange({ ...block, collapsed })}
      />
    </>
  );
}
