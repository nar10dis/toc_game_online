import type { CSSProperties } from "react";

// A tiled SVG can't read our theme tokens, so the stroke is a mid grey that stays
// faint on the light and the dark background alike.
const sketchbookLines =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M0 .5H32' fill='none' stroke='%236b7280' stroke-opacity='.3' stroke-dasharray='2 4'/%3E%3C/svg%3E\")";

// The sheen stays this faint on purpose: any stronger and it washes --background
// out instead of letting the theme colour show through.
/** The paper sheet every page is printed on: dashed sketchbook rules, grain and sheen. */
export const paperStyle: CSSProperties = {
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
  backgroundImage: `
    linear-gradient(115deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 45%, rgba(255,255,255,0.05)),
    radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.025) 0.5px, transparent 0.8px),
    radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.018) 0.5px, transparent 0.8px),
    ${sketchbookLines}
  `,
  backgroundSize: "100% 100%, 7px 7px, 11px 11px, 32px 32px",
};
