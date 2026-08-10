import { motion } from "motion/react";

import { CELL_RADIUS, type Point } from "@/game/boardGeometry";
import { handDrawnCirclePath, handDrawnLinePath } from "@/game/handDrawn";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** Dash then gap. Their total is what the dashes travel to loop seamlessly. */
const DASH_PATTERN = "16 14";
const DASH_LENGTH = 30;

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type MovePreviewProps = {
  color?: string;
  /** Cells the pawn would travel over, the one it stands on first. */
  stops: Point[];
};

/** The dotted trail shown under a pawn the player is about to move. */
export function MovePreview({ color = "#29251f", stops }: MovePreviewProps) {
  if (stops.length < 2) return null;

  const arrival = stops[stops.length - 1];

  return (
    //the trail must never steal the click meant for a pawn underneath it.
    <g style={{ pointerEvents: "none" }}>
      <motion.path
        d={handDrawnLinePath(stops)}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={DASH_PATTERN}
        initial={{ opacity: 0 }}
        //the dashes crawl towards the arrival cell, as if still being drawn.
        animate={{ opacity: 0.85, strokeDashoffset: [0, -DASH_LENGTH * 2] }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.15 },
          strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
        }}
      />

      <motion.path
        d={handDrawnCirclePath(arrival.x, arrival.y, CELL_RADIUS + 8, 4000)}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={DASH_PATTERN}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.85, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </g>
  );
}
