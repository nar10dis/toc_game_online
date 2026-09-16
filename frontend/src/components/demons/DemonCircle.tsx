import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTime, useTransform } from "motion/react";

import { DemonRing } from "@/components/demons/DemonRing";
import { SparkleTrail } from "@/components/demons/SparkleTrail";

const demonImages = [
  "/club_demon.png",
  "/diamon_demon.png",
  "/heart_demon.png",
  "/spade_demon.png",
];

const oneTurnInMs = 30000;
// Extra space so the demons don't touch the corners of the content
const circleMargin = 40;

/** Wraps content in an invisible circle with the four demons slowly turning on it. */
export function DemonCircle({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(0);

  const time = useTime();
  const rotation = useTransform(time, (elapsedMs) => (elapsedMs / oneTurnInMs) * 360);

  // The circle follows the content size, which changes with the title length
  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const halfDiagonal = Math.hypot(content.offsetWidth, content.offsetHeight) / 2;
      setRadius(halfDiagonal + circleMargin);
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {radius > 0 && (
        <>
          <SparkleTrail radius={radius} rotation={rotation} demonCount={demonImages.length} />
          <DemonRing images={demonImages} radius={radius} rotation={rotation} />
        </>
      )}

      <div ref={contentRef}>{children}</div>
    </div>
  );
}
