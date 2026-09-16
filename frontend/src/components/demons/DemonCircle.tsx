import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motionValue, useTime, useTransform } from "motion/react";

import { DemonRing } from "@/components/demons/DemonRing";
import { SparkleTrail } from "@/components/demons/SparkleTrail";
import { pointOnCircle } from "@/lib/pointOnCircle";
import { randomBetween } from "@/lib/randomBetween";

const demonImages = [
  "/club_demon.png",
  "/diamon_demon.png",
  "/heart_demon.png",
  "/spade_demon.png",
];

const oneTurnInMs = 30000;
// Extra space so the demons don't touch the corners of the content
const circleMargin = 40;
// Sparkles start a little behind the demon, otherwise the drawing hides them
const sparkleDegreesBehindDemon = 8;
// How far a sparkle can land from the circle path, in px
const sparkleMaxDistanceFromPath = 22;

/** Wraps content in an invisible circle with the four demons slowly turning on it. */
export function DemonCircle({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(0);
  // How far each demon is behind its normal place on the ring, in degrees (0 unless it was clicked)
  const [angleOffsets] = useState(() => demonImages.map(() => motionValue(0)));

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

  function getSparkleSpots() {
    return angleOffsets.map((angleOffset, index) => {
      const demonAngle = rotation.get() + (index / angleOffsets.length) * 360 + angleOffset.get();
      const distanceFromCenter =
        radius + randomBetween(-sparkleMaxDistanceFromPath, sparkleMaxDistanceFromPath);
      return pointOnCircle(demonAngle - sparkleDegreesBehindDemon, distanceFromCenter);
    });
  }

  return (
    <div className="relative flex items-center justify-center">
      {radius > 0 && (
        <>
          <SparkleTrail getSpots={getSparkleSpots} />
          <DemonRing
            images={demonImages}
            radius={radius}
            rotation={rotation}
            angleOffsets={angleOffsets}
            oneTurnInMs={oneTurnInMs}
          />
        </>
      )}

      <div ref={contentRef}>{children}</div>
    </div>
  );
}
