import { motion } from "motion/react";
import type { MotionValue } from "motion/react";

import { RingDemon } from "@/components/demons/RingDemon";

/** The demons spread evenly on a circle that turns with `rotation`. */
export function DemonRing({
  images,
  radius,
  rotation,
  angleOffsets,
  oneTurnInMs,
}: {
  images: string[];
  radius: number;
  rotation: MotionValue<number>;
  angleOffsets: MotionValue<number>[];
  oneTurnInMs: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute top-1/2 left-1/2 will-change-transform"
      style={{ rotate: rotation }}
    >
      {images.map((image, index) => (
        <RingDemon
          key={image}
          image={image}
          angle={(index / images.length) * 360}
          radius={radius}
          rotation={rotation}
          angleOffset={angleOffsets[index]}
          oneTurnInMs={oneTurnInMs}
        />
      ))}
    </motion.div>
  );
}
