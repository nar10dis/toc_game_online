import { motion, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

import { DemonDrawing } from "@/components/demons/DemonDrawing";
import { pointOnCircle } from "@/lib/pointOnCircle";

/** The demons spread evenly on a circle that turns with `rotation`. */
export function DemonRing({
  images,
  radius,
  rotation,
}: {
  images: string[];
  radius: number;
  rotation: MotionValue<number>;
}) {
  // Each demon turns the other way so it stays upright
  const uprightRotation = useTransform(rotation, (angle) => -angle);

  return (
    <motion.div
      className="pointer-events-none absolute top-1/2 left-1/2 will-change-transform"
      style={{ rotate: rotation }}
    >
      {images.map((image, index) => {
        const position = pointOnCircle((index / images.length) * 360, radius);

        return (
          <div
            key={image}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: position.x, top: position.y }}
          >
            <motion.div className="will-change-transform" style={{ rotate: uprightRotation }}>
              <DemonDrawing image={image} />
            </motion.div>
          </div>
        );
      })}
    </motion.div>
  );
}
