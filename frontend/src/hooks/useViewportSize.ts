import { useEffect, useState } from "react";

import type { ViewportSize } from "@/game/cardTableLayout";

/**
 * Current size of the browser window, kept in sync on resize.
 *
 * Starts at 0x0 because the window does not exist while the page is rendered
 * on the server; callers should wait for a non-zero width before positioning
 * anything, otherwise the first paint would be off-screen.
 */
export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateViewportSize = () =>
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  return viewportSize;
}
