import { motion } from "motion/react";

import { TEAM_COLORS } from "@/lib/game/boardGeometry";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** How long the banner shows, in seconds: it pops in, stays, then fades away. */
const BANNER_DURATION = 1.8;

/** Above every card: the hand, the discard pile (from 100) and the hover hint (200). */
const BANNER_STACKING_ORDER = 300;

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type TurnBannerProps = {
  isMyTurn: boolean;
  mySeat: number;
};

/**
 * "À toi de jouer !" written across the board for a moment when the turn comes
 * to me — my own demon is not drawn on the board, so nothing would pulse there.
 * Goes inside the box of the board, which must be `position: relative`.
 */
export function TurnBanner({ isMyTurn, mySeat }: TurnBannerProps) {
  if (!isMyTurn) {
    return null;
  }

  // mounted again on every turn of mine, so it plays once each time
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ zIndex: BANNER_STACKING_ORDER }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.1] }}
      transition={{ duration: BANNER_DURATION, times: [0, 0.15, 0.8, 1], ease: "easeOut" }}
    >
      <p
        className="font-heading rounded-2xl bg-background/80 px-8 py-3 text-5xl font-bold shadow-lg backdrop-blur-sm md:text-6xl"
        style={{ color: TEAM_COLORS[mySeat] }}
      >
        À toi de jouer !
      </p>
    </motion.div>
  );
}
