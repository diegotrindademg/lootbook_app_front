import styles from "./BlockIcon.module.css";

/**
 * The 17 block icons plus the editor's UI glyphs, path data copied from the design system bundle
 * (`GLYPH_PATHS`, Lucide-derived, 24 grid, round 2px strokes). Heart and star are filled.
 * Decorative: give the control around it a name.
 */
const BLOCK_GLYPHS = {
  sword: ["M14.5 17.5 3 6V3h3l11.5 11.5", "M13 19l6-6", "m16 16 4 4", "m19 21 2-2"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  heart: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  ],
  sparkles: ["M12 3v4m0 10v4M3 12h4m10 0h4", "m6 6 2 2m8 8 2 2M6 18l2-2m8-8 2-2"],
  book: ["M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"],
  scroll: ["M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4", "M19 17V5a2 2 0 0 0-2-2H4"],
  dice: ["M3 3h18v18H3z", "M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"],
  flame: ["M12 22c4-2 6-5 6-8.5 0-3-2-5.5-3-6.5-.5 2-2 3-3 3.5 0-3-1.5-5.5-4-7.5 0 3-2 5-4 7.5C2.5 13.5 4 19 12 22z"],
  star: ["m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  map: ["m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z", "M9 3v15", "M15 6v15"],
  eye: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  bolt: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  potion: ["M10 2h4", "M10 2v6l-5 8a5 5 0 0 0 4 8h6a5 5 0 0 0 4-8l-5-8V2"],
  backpack: [
    "M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
    "M9 6V4a3 3 0 0 1 6 0v2",
    "M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5",
  ],
  pen: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"],
  target: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
    "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ],
  pin: [
    "M12 17v5",
    "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
  ],
  grip: ["M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"],
  trash: ["M3 6h18", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"],
  chevronDown: ["m6 9 6 6 6-6"],
  minus: ["M5 12h14"],
  plus: ["M5 12h14", "M12 5v14"],
} as const;

export type BlockGlyph = keyof typeof BLOCK_GLYPHS;

type BlockIconProps = {
  icon: BlockGlyph;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function BlockIcon({ icon, size = 20, strokeWidth = 2, className }: BlockIconProps) {
  const filled = icon === "heart" || icon === "star";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {BLOCK_GLYPHS[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The tinted square that frames a block icon (design `BlockIconBox`): radius 8, 12 from 40px. */
export function BlockIconBox({ icon, size = 32, active = true }: { icon: BlockGlyph; size?: number; active?: boolean }) {
  return (
    <span
      className={active ? styles.box : `${styles.box} ${styles.inactive}`}
      style={{ width: size, height: size, borderRadius: size >= 40 ? 12 : 8 }}
      aria-hidden="true"
    >
      <BlockIcon icon={icon} size={Math.round(size * 0.55)} />
    </span>
  );
}
