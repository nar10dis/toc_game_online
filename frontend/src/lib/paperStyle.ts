import type { CSSProperties } from "react";

// The sheen stays this faint on purpose: any stronger and it washes --background
// out instead of letting the theme colour show through.
/** The paper sheet every page is printed on: grain and sheen. */
export const paperStyle: CSSProperties = {
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
  backgroundImage: `
    linear-gradient(115deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 45%, rgba(255,255,255,0.05)),
    radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.025) 0.5px, transparent 0.8px),
    radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.018) 0.5px, transparent 0.8px)
  `,
  backgroundSize: "100% 100%, 7px 7px, 11px 11px",
};
