/**
 * The Lootbook UI glyphs on a 24 grid with round 2px strokes, path data from the design system
 * (Icons.jsx and the BlockIcon set). Decorative by default: give the button around it a name.
 */
const GLYPHS = {
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.128a4 4 0 0 1 0 7.744",
  ],
  sword: [
    "m11 19-6-6",
    "m5 21-2-2",
    "m8 16-4 4",
    "M9.5 17.5 20.414 6.586A2 2 0 0 0 21 5.172V3h-2.172a2 2 0 0 0-1.414.586L6.5 14.5",
  ],
  settings: [
    "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  ],
  search: ["m21 21-4.34-4.34", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],
  plus: ["M5 12h14", "M12 5v14"],
  arrowRight: ["M5 12h14", "m12 5 7 7-7 7"],
  addCircle: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M8 12h8", "M12 8v8"],
  chevronLeft: ["m15 18-6-6 6-6"],
  check: ["M20 6 9 17l-5-5"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  sliders: [
    "M10 5H3", "M12 19H3", "M14 3v4", "M16 17v4", "M21 12h-9", "M21 19h-5", "M21 5h-7", "M8 10v4", "M8 12H3",
  ],
  pen: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"],
  copy: ["M8 8h12v12H8z", "M16 8V4H4v12h4"],
  trash: [
    "M3 6h18",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  ],
  // Not in the design system yet: the Lucide archive glyph, drawn on the same grid.
  archive: ["M3 3h18v5H3z", "M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8", "M10 12h4"],
  more: ["M12 12h.01M19 12h.01M5 12h.01"],
  mail: ["M3 6h18v12H3z", "m3 7 9 6 9-6"],
  alert: ["M12 3 2 20h20L12 3z", "M12 9v5", "M12 17h.01"],
  eye: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  undo: ["M3 8h10a5 5 0 0 1 0 10H8", "m3 8 4-4", "m3 8 4 4"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  // Figma icon/offline 2425:36413, the Lucide wifi-off glyph.
  offline: [
    "M12 20h.01",
    "M8.5 16.429a5 5 0 0 1 7 0",
    "M5 12.859a10 10 0 0 1 5.17-2.69",
    "M19 12.859a10 10 0 0 0-2.007-1.523",
    "M2 8.82a15 15 0 0 1 4.177-2.643",
    "M22 8.82a15 15 0 0 0-11.288-3.764",
    "m2 2 20 20",
  ],
} as const;

export type IconName = keyof typeof GLYPHS;

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function Icon({ name, size = 24, strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
