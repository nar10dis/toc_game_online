import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Sparkle } from "lucide-react";

import { randomBetween } from "@/lib/randomBetween";

// One sparkle per demon every 300ms, each living 1.6s: about 5 sparkles behind a demon
const newSparkleEveryMs = 300;
const sparkleLifetimeMs = 1600;

/**
 * Where a new sparkle appears, in px from the trail container. `zIndex` and `opacity` let it go behind things.
 * `color` is any CSS colour, the ink colour by default.
 */
export type SparkleSpot = {
  x: number;
  y: number;
  zIndex?: number;
  opacity?: number;
  color?: string;
};

type SparkleData = SparkleSpot & {
  id: number;
  size: number;
  createdAt: number;
};

/** Small twinkling stars left behind the demons. `getSpots` gives one spot per demon, read every 300ms. */
export function SparkleTrail({ getSpots }: { getSpots: () => SparkleSpot[] }) {
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);
  const nextId = useRef(0);
  // Kept in a ref so a new function on each render does not restart the timer
  const getSpotsRef = useRef(getSpots);

  useEffect(() => {
    getSpotsRef.current = getSpots;
  }, [getSpots]);

  useEffect(() => {
    function addSparkles() {
      const now = Date.now();
      const newSparkles = getSpotsRef.current().map((spot) => {
        const sparkle: SparkleData = {
          ...spot,
          id: nextId.current,
          size: randomBetween(8, 14),
          createdAt: now,
        };
        nextId.current++;
        return sparkle;
      });

      setSparkles((currentSparkles) => {
        const aliveSparkles = currentSparkles.filter((sparkle) => now - sparkle.createdAt < sparkleLifetimeMs);
        return [...aliveSparkles, ...newSparkles];
      });
    }

    const timer = setInterval(addSparkles, newSparkleEveryMs);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            zIndex: sparkle.zIndex,
            opacity: sparkle.opacity,
            color: sparkle.color,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 0.4, 1, 0], scale: [0, 1, 0.7, 1, 0], rotate: 90 }}
            transition={{ duration: sparkleLifetimeMs / 1000, ease: "easeInOut" }}
          >
            <Sparkle size={sparkle.size} fill="currentColor" />
          </motion.div>
        </div>
      ))}
    </div>
  );
}
