import { motion } from "motion/react";

import type { Point } from "@/game/boardGeometry";
import { handDrawnCirclePath } from "@/game/handDrawn";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

const PAWN_RADIUS = 16;
/** How long the pawn takes to hop over one cell. */
const STEP_DURATION_IN_SECONDS = 0.13;
/** How much the pawn swells in the middle of a hop, so it reads as a jump. */
const HOP_SCALE = 1.5;
/** How much it flattens when it lands on a cell, before jumping again. */
const LANDING_SQUASH = 0.82;
/** How far it leans in the air, one way then the other. */
const HOP_TILT_IN_DEGREES = 14;
/** Kept the same for every pawn, so a moving pawn never changes shape. */
const PAWN_WOBBLE_SEED = 7;

/** How the pawn settles when it is not walking the track. */
const PAWN_SETTLE = {
  type: "spring",
  stiffness: 600,
  damping: 14,
} as const;

/* ************************************************************************** */
/*                                 TYPES DEF                                  */
/* ************************************************************************** */

type PawnProps = {
  color?: string;
  /** Where the pawn rests, in board coordinates. */
  position: Point;
  /** Cells it hops over to get there, in order. Empty while it stands still. */
  path?: Point[];
  /** Makes the pawn shine and clickable. */
  isSelectable?: boolean;
  onClick?: () => void;
  /** Called once the pawn has landed, which ends the move. */
  onArrived?: () => void;
  /** True while the pointer is over a selectable pawn. */
  onHoverChange?: (isHovered: boolean) => void;
};

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

/** One pawn, drawn inside the board's `svg`. */
export function Pawn({
  color = "var(--foreground)",
  position,
  path = [],
  isSelectable = false,
  onClick,
  onArrived,
  onHoverChange,
}: PawnProps) {
  const isWalking = path.length > 0;

  function handleClick() {
    if (!isSelectable) return;
    if (onClick) onClick();
  }

  function handleHover(isHovered: boolean) {
    if (!isSelectable) return;
    if (onHoverChange) onHoverChange(isHovered);
  }

  //two keyframes per cell crossed: one in the air, one landing. The pawn swells
  //as it jumps and squashes as it lands, and that is what reads as bounce.
  const hopScales = [1];
  const hopTilts = [0];

  for (let step = 0; step < path.length; step++) {
    const isLastStep = step === path.length - 1;

    hopScales.push(HOP_SCALE);
    hopScales.push(isLastStep ? 1 : LANDING_SQUASH);

    //leans one way then the other, so it never looks like it slides.
    hopTilts.push(step % 2 === 0 ? -HOP_TILT_IN_DEGREES : HOP_TILT_IN_DEGREES);
    hopTilts.push(0);
  }

  //each cell is crossed on its own ease, so the hops stay separate.
  const stepEases = path.map(() => "easeInOut" as const);

  //`null` means "start from where the pawn stands right now".
  const walkingTransform = {
    x: [null, ...path.map((cell) => cell.x)],
    y: [null, ...path.map((cell) => cell.y)],
    scale: hopScales,
    rotate: hopTilts,
    opacity: 1,
  };

  const restingTransform = {
    x: position.x,
    y: position.y,
    scale: 1,
    rotate: 0,
    opacity: 1,
  };

  const walkDuration = path.length * STEP_DURATION_IN_SECONDS;

  //x and y hop from cell to cell, while the swell and the lean run their own
  //keyframes over the same time.
  const walkTransition = {
    x: { duration: walkDuration, ease: stepEases },
    y: { duration: walkDuration, ease: stepEases },
    scale: { duration: walkDuration, ease: "easeOut" as const },
    rotate: { duration: walkDuration, ease: "easeInOut" as const },
  };

  return (
    <motion.g
      style={{ cursor: isSelectable ? "pointer" : "default" }}
      onClick={handleClick}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      initial={{ x: position.x, y: position.y, scale: 0.4, rotate: 0, opacity: 0 }}
      animate={isWalking ? walkingTransform : restingTransform}
      transition={isWalking ? walkTransition : PAWN_SETTLE}
      onAnimationComplete={onArrived}
    >
      {isSelectable && (
        <motion.circle
          r={PAWN_RADIUS + 10}
          fill="none"
          stroke={color}
          strokeWidth={4}
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.15, 0.75, 0.15] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.path
        d={handDrawnCirclePath(0, 0, PAWN_RADIUS, PAWN_WOBBLE_SEED)}
        fill={color}
        stroke="var(--foreground)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        whileHover={isSelectable ? { scale: 1.15 } : undefined}
      />

      {/* pen highlight, so the token does not read as a flat blob */}
      <circle
        cx={-PAWN_RADIUS * 0.3}
        cy={-PAWN_RADIUS * 0.35}
        r={PAWN_RADIUS * 0.28}
        fill="var(--background)"
        opacity={0.55}
      />
    </motion.g>
  );
}
