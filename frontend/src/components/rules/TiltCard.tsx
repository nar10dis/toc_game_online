"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const MAX_TILT_IN_DEGREES = 20;

// The card artwork files are 800 x 1080
const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 1080;

type TiltCardProps = {
  imagePath: string;
  label: string;
};

export function TiltCard({ imagePath, label }: TiltCardProps) {
  // Pointer position inside the card, from 0 to 1. The middle means no tilt.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const smoothPointerX = useSpring(pointerX, { stiffness: 250, damping: 20 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 250, damping: 20 });

  // The side under the pointer sinks away from the viewer
  const rotateY = useTransform(smoothPointerX, [0, 1], [-MAX_TILT_IN_DEGREES, MAX_TILT_IN_DEGREES]);
  const rotateX = useTransform(smoothPointerY, [0, 1], [MAX_TILT_IN_DEGREES, -MAX_TILT_IN_DEGREES]);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const cardBox = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - cardBox.left) / cardBox.width);
    pointerY.set((event.clientY - cardBox.top) / cardBox.height);
  }

  function handleMouseLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <div className="shrink-0 perspective-[400px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.15 }}
        style={{ rotateX, rotateY }}
        className="w-12 will-change-transform md:w-14"
      >
        <Image
          src={imagePath}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          alt={label}
          draggable={false}
          className="h-auto w-full drop-shadow-sm"
        />
      </motion.div>
    </div>
  );
}
