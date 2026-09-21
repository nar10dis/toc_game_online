import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Shifting the noise keeps the two lines from wearing out in the exact same spots
const innerLineStyle: CSSProperties = {
  maskPosition: "130px 90px",
  WebkitMaskPosition: "130px 90px",
};

export function WornFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative px-6 py-5 md:px-8 md:py-6", className)}>
      <div
        aria-hidden
        className="worn-line pointer-events-none absolute inset-0 border border-current opacity-70"
      />
      <div
        aria-hidden
        className="worn-line pointer-events-none absolute inset-[5px] border border-current opacity-60"
        style={innerLineStyle}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
