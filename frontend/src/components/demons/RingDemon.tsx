import { useState } from "react";
import { animate, motion, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

import { AngerMarks } from "@/components/demons/AngerMarks";
import { DemonDrawing } from "@/components/demons/DemonDrawing";
import { pointOnCircle } from "@/lib/pointOnCircle";

const stopDurationMs = 700;
const catchUpDurationMs = 1000;

/** One demon on the ring. Clicking it makes it stop, get angry, then catch up with its place. */
export function RingDemon({
  image,
  angle,
  radius,
  rotation,
  angleOffset,
  oneTurnInMs,
}: {
  image: string;
  angle: number;
  radius: number;
  rotation: MotionValue<number>;
  angleOffset: MotionValue<number>;
  oneTurnInMs: number;
}) {
  const [isAngry, setIsAngry] = useState(false);

  const position = pointOnCircle(angle, radius);
  // The demon turns the other way so it stays upright
  const uprightRotation = useTransform([rotation, angleOffset], ([ringAngle, offset]: number[]) => {
    return -(ringAngle + offset);
  });

  async function handleClick() {
    if (isAngry) {
      return;
    }
    setIsAngry(true);

    // Going backwards exactly as fast as the ring turns keeps the demon still
    const degreesDuringStop = (stopDurationMs / oneTurnInMs) * 360;
    await animate(angleOffset, angleOffset.get() - degreesDuringStop, {
      duration: stopDurationMs / 1000,
      ease: "linear",
    });

    setIsAngry(false);
    await animate(angleOffset, 0, { duration: catchUpDurationMs / 1000, ease: "easeInOut" });
  }

  return (
    <motion.div className="absolute will-change-transform" style={{ rotate: angleOffset }}>
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: position.x, top: position.y }}
      >
        <motion.div
          className="pointer-events-auto relative cursor-pointer will-change-transform"
          style={{ rotate: uprightRotation }}
          onClick={handleClick}
        >
          <AngerMarks isVisible={isAngry} />
          <DemonDrawing image={image} />
        </motion.div>
      </div>
    </motion.div>
  );
}
