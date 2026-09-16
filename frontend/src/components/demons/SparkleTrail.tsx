import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { MotionValue } from "motion/react";
import { Sparkle } from "lucide-react";

import { pointOnCircle } from "@/lib/pointOnCircle";

// One sparkle per demon every 300ms, each living 1.6s: about 5 sparkles behind a demon
const newSparkleEveryMs = 300;
const sparkleLifetimeMs = 1600;
// Sparkles start a little behind the demon, otherwise the drawing hides them
const degreesBehindDemon = 8;
// How far a sparkle can land from the circle path, in px
const maxDistanceFromPath = 22;

type SparkleData = {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Small twinkling stars left behind each demon turning on the circle. */
export function SparkleTrail({
  radius,
  rotation,
  demonCount,
}: {
  radius: number;
  rotation: MotionValue<number>;
  demonCount: number;
}) {
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    function addSparkles() {
      const now = Date.now();
      const newSparkles: SparkleData[] = [];

      for (let index = 0; index < demonCount; index++) {
        const demonAngle = rotation.get() + (index / demonCount) * 360;
        const distanceFromCenter = radius + randomBetween(-maxDistanceFromPath, maxDistanceFromPath);
        const position = pointOnCircle(demonAngle - degreesBehindDemon, distanceFromCenter);

        newSparkles.push({
          id: nextId.current,
          x: position.x,
          y: position.y,
          size: randomBetween(8, 14),
          createdAt: now,
        });
        nextId.current++;
      }

      setSparkles((currentSparkles) => {
        const aliveSparkles = currentSparkles.filter((sparkle) => now - sparkle.createdAt < sparkleLifetimeMs);
        return [...aliveSparkles, ...newSparkles];
      });
    }

    const timer = setInterval(addSparkles, newSparkleEveryMs);
    return () => clearInterval(timer);
  }, [radius, rotation, demonCount]);

  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: sparkle.x, top: sparkle.y }}
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
