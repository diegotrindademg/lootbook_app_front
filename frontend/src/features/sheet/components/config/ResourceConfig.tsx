import type { ResetRule, ResourceBlock, ResourceModel } from "../../types";
import { mintId } from "../../utils/ids";
import { Field, SectionLabel } from "../controls/Field";
import GhostPill from "../controls/GhostPill";
import RoundButton from "../controls/RoundButton";
import Segmented from "../controls/Segmented";
import Stepper from "../controls/Stepper";
import { ConfigHint, DetailField, LimitHint } from "./ConfigRows";
import styles from "./TypeConfig.module.css";

type ResetMode = ResetRule["mode"];

/**
 * A Resource block's settings (design 03.3): how it is tracked, its maximum or its tiers, and when it
 * resets. Reset words follow M0: Manual, Each session, or a label the user types.
 */
export default function ResourceConfig({
  block,
  onChange,
}: {
  block: ResourceBlock;
  onChange: (block: ResourceBlock) => void;
}) {
  const set = (patch: Partial<ResourceBlock>) => onChange({ ...block, ...patch });
  const first = block.tiers[0];

  const setModel = (model: ResourceModel) => {
    if (model === "tiered" && block.model !== "tiered") {
      // Slots keep the single value as their first tier.
      set({ model, tiers: [{ ...first, label: "Tier 1", max: Math.min(Math.max(first.max, 1), 12) }] });
    } else if (model !== "tiered" && block.model === "tiered") {
      set({ model, tiers: [{ ...first, label: block.title }] });
    } else {
      set({ model });
    }
  };

  const setTier = (index: number, patch: Partial<ResourceBlock["tiers"][number]>) =>
    set({ tiers: block.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) });

  const setReset = (mode: ResetMode) =>
    set({ reset: mode === "label" ? { mode, label: block.reset.mode === "label" ? block.reset.label : "" } : { mode } });

  return (
    <>
      <SectionLabel>Tracking</SectionLabel>
      <Segmented<ResourceModel>
        label="Tracking"
        options={[
          ["counter", "Counter"],
          ["pips", "Pips"],
          ["tiered", "Slots"],
          ["gauge", "Gauge"],
        ]}
        value={block.model}
        onChange={setModel}
      />

      {block.model === "tiered" ? (
        <>
          <SectionLabel>Tiers</SectionLabel>
          <div className={styles.stack}>
            {block.tiers.map((tier, index) => (
              <div key={tier.localId} className={styles.tier}>
                <Field
                  label={`Tier ${index + 1} name`}
                  size="sm"
                  value={tier.label}
                  placeholder="Tier"
                  maxLength={120}
                  onChange={(event) => setTier(index, { label: event.target.value })}
                />
                <Stepper
                  label={`${tier.label || `Tier ${index + 1}`} slots`}
                  value={tier.max}
                  min={1}
                  max={12}
                  onChange={(max) => setTier(index, { max, current: Math.min(tier.current, max) })}
                />
                {block.tiers.length > 1 && (
                  <RoundButton
                    icon="close"
                    label={`Remove ${tier.label || `tier ${index + 1}`}`}
                    onClick={() => set({ tiers: block.tiers.filter((_, i) => i !== index) })}
                  />
                )}
              </div>
            ))}
            <LimitHint count={block.tiers.length} max={12} noun="tiers" />
            {block.tiers.length < 12 && (
              <div>
                <GhostPill
                  onClick={() =>
                    set({
                      tiers: [
                        ...block.tiers,
                        { key: null, localId: mintId("t"), label: `Tier ${block.tiers.length + 1}`, current: 0, max: 2 },
                      ],
                    })
                  }
                >
                  + Add tier
                </GhostPill>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.inline}>
          <SectionLabel>Maximum</SectionLabel>
          <Stepper
            label="Maximum"
            value={first.max}
            min={0}
            max={999}
            onChange={(max) => setTier(0, { max, current: Math.min(first.current, max) })}
          />
        </div>
      )}

      <SectionLabel>Reset rule</SectionLabel>
      <Segmented<ResetMode>
        label="Reset rule"
        options={[
          ["manual", "Manual"],
          ["session", "Each session"],
          ["label", "Custom"],
        ]}
        value={block.reset.mode}
        onChange={setReset}
      />
      {block.reset.mode === "label" && (
        // Figma page 5, R8 to R11: an empty label falls back to Manual when the sheet is saved.
        <DetailField label="When does it reset?">
          <Field
            label="When does it reset?"
            value={block.reset.label}
            maxLength={80}
            placeholder="a full night's rest"
            onChange={(event) => set({ reset: { mode: "label", label: event.target.value } })}
          />
          <ConfigHint>
            {block.reset.label.trim()
              ? `On the sheet: "Resets on ${block.reset.label.trim()}"`
              : "Left empty, it resets manually."}
          </ConfigHint>
        </DetailField>
      )}
    </>
  );
}
