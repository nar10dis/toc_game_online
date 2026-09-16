import { motion, useTime, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

import { CracklingFire } from "@/components/demons/CracklingFire";
import { DemonDrawing } from "@/components/demons/DemonDrawing";
import { SparkleTrail } from "@/components/demons/SparkleTrail";
import { randomBetween } from "@/lib/randomBetween";

const demonImages = [
  "/club_demon.png",
  "/diamon_demon.png",
  "/heart_demon.png",
  "/spade_demon.png",
];

const oneTurnInMs = 20000;
// Half the width of the orbit, in px
const orbitRadiusX = 210;
// Height of the ellipse compared to its width: small means a light tilt
const orbitFlatness = 0.3;
// The whole orbit leans a little
const orbitLean = (-6 * Math.PI) / 180;
const orbitRadiusY = orbitRadiusX * orbitFlatness;

// Opacity of a demon once it is fully hidden by the fire
const opacityBehindFire = 0.15;
// Horizontal distance from the fire centre where a demon behind starts and ends fading, in px
const fadeStartDistance = 130;
const fadeFullDistance = 50;
const smallestScale = 0.65;
const biggestScale = 1;

// One dance step is a swing to one side and back
const danceStepInMs = 900;
const danceTiltInDegrees = 10;
const danceHopInPx = 5;

// Height of a demon drawing at full size (h-24), in px
const demonHeight = 96;
// Space kept between the head of a demon passing in front and the bottom of the logs
const gapUnderLogs = 10;
// The logs don't reach the very bottom of the fire drawing
const logsBottomInsideFire = 5;
// The fire sits high enough that demons passing in front go under the logs instead of across them
const fireBottomAboveOrbitCentre =
  demonHeight + danceHopInPx + gapUnderLogs - orbitRadiusY - logsBottomInsideFire;

// Sparkles start a little behind the demon, and around its body rather than at its feet
const sparkleDegreesBehindDemon = 10;
const sparkleHeightAboveFeet = 35;
const sparkleMaxDistanceFromPath = 18;

const behindFireZIndex = 0;
const fireZIndex = 10;
const inFrontOfFireZIndex = 20;

// 0 at `from`, 1 at `to`, smooth in between (works both ways)
function smoothStep(from: number, to: number, value: number) {
  const progress = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return progress * progress * (3 - 2 * progress);
}

/** How visible something is at this spot: 1 away from the fire, down to `opacityBehindFire` right behind it. */
function opacityAroundFire(x: number, depth: number) {
  const isBehind = smoothStep(0.1, -0.25, depth);
  const isOverFire = smoothStep(fadeStartDistance, fadeFullDistance, Math.abs(x));
  return 1 - isBehind * isOverFire * (1 - opacityBehindFire);
}

/** Point on the leaned ellipse, in px from its centre. `depth` goes from -1 (far behind the fire) to 1 (right in front). */
function pointOnOrbit(angleInDegrees: number) {
  const angle = (angleInDegrees * Math.PI) / 180;
  const flatX = Math.cos(angle) * orbitRadiusX;
  const flatY = Math.sin(angle) * orbitRadiusY;

  // The lean is done here because a CSS rotate on the orbit would stop demons passing in front of the fire
  return {
    x: flatX * Math.cos(orbitLean) - flatY * Math.sin(orbitLean),
    y: flatX * Math.sin(orbitLean) + flatY * Math.cos(orbitLean),
    depth: Math.sin(angle),
  };
}

function demonAngle(elapsedMs: number, index: number) {
  return (index / demonImages.length) * 360 + (elapsedMs / oneTurnInMs) * 360;
}

/** One demon dancing its way around the fire. */
function DancingDemon({ image, index, time }: { image: string; index: number; time: MotionValue<number> }) {
  const point = useTransform(time, (elapsedMs) => pointOnOrbit(demonAngle(elapsedMs, index)));

  const x = useTransform(point, ({ x }) => x);
  const y = useTransform(point, ({ y }) => y);
  const scale = useTransform(point, ({ depth }) => {
    return smallestScale + ((depth + 1) / 2) * (biggestScale - smallestScale);
  });
  // Fades only while it is behind the fire and close to it
  const opacity = useTransform(point, ({ x, depth }) => opacityAroundFire(x, depth));
  // The swap happens at the far left and right of the orbit, away from the fire
  const zIndex = useTransform(point, ({ depth }) => (depth < 0 ? behindFireZIndex : inFrontOfFireZIndex));

  // Each demon dances a little out of step with the others
  const danceAngle = useTransform(time, (elapsedMs) => {
    return (elapsedMs / danceStepInMs) * Math.PI + index * 1.3;
  });
  const tilt = useTransform(danceAngle, (angle) => Math.sin(angle) * danceTiltInDegrees);
  // A small hop each time it passes upright
  const hop = useTransform(danceAngle, (angle) => -Math.abs(Math.cos(angle)) * danceHopInPx);

  return (
    <motion.div className="absolute will-change-transform" style={{ x, y, scale, opacity, zIndex }}>
      {/* The point on the orbit is under the demon's feet */}
      <div className="-translate-x-1/2 -translate-y-full">
        <motion.div className="origin-bottom will-change-transform" style={{ rotate: tilt, y: hop }}>
          <DemonDrawing image={image} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/** The four demons dancing in a circle around a crackling campfire, leaving a trail of sparkles. */
export function DemonCampfire() {
  const time = useTime();

  function getSparkleSpots() {
    return demonImages.map((_, index) => {
      const point = pointOnOrbit(demonAngle(time.get(), index) - sparkleDegreesBehindDemon);
      const x = point.x + randomBetween(-sparkleMaxDistanceFromPath, sparkleMaxDistanceFromPath);
      return {
        x,
        y: point.y - sparkleHeightAboveFeet + randomBetween(-sparkleMaxDistanceFromPath, sparkleMaxDistanceFromPath),
        zIndex: point.depth < 0 ? behindFireZIndex : inFrontOfFireZIndex,
        opacity: opacityAroundFire(x, point.depth),
      };
    });
  }

  return (
    // Hidden on mobile for now. No transform nor z-index on the wrappers, so demons and fire share the same stacking order
    <div className="relative mx-auto hidden h-96 w-full max-w-xl md:block" aria-hidden="true">
      {/* Centre of the orbit, on the ground under the fire */}
      <div className="pointer-events-none absolute bottom-[90px] left-1/2">
        <SparkleTrail getSpots={getSparkleSpots} />

        <div
          className="absolute left-0 -translate-x-1/2"
          style={{ bottom: fireBottomAboveOrbitCentre, zIndex: fireZIndex }}
        >
          <CracklingFire />
        </div>

        {demonImages.map((image, index) => (
          <DancingDemon key={image} image={image} index={index} time={time} />
        ))}
      </div>
    </div>
  );
}
