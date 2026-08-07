import Image from "next/image";
import { motion, type Transition } from "motion/react";

import { CLEAR_TABLE_FALL } from "@/game/cardAnimation";
import { getCardFrenchLabel, getCardImagePath, type Card } from "@/game/cardDeck";
import {
  CARD_HEIGHT_IN_PIXELS,
  CARD_WIDTH_IN_PIXELS,
  DEAL_IN_START_TRANSFORM,
  getCardOffScreenY,
  type CardTransform,
  type ViewportSize,
} from "@/game/cardTableLayout";

/** How far a playable card lifts when the pointer hovers it, in pixels. */
const HOVER_LIFT_IN_PIXELS = 18;

type SingleCardOnTableProps = {
  card: Card;
  /** Where the card should rest right now: its slot in the fan, or the middle. */
  targetTransform: CardTransform;
  /** Paint order against the other cards on the table. */
  stackingOrder: number;
  viewportSize: ViewportSize;
  /** How the card travels to `targetTransform`. */
  movementTransition: Transition;
  /**
   * Plays the card. `null` for the card already in the middle, and for the
   * whole hand while another card is still on its way there.
   */
  onPlay: (() => void) | null;
  /**
   * Called once the card has settled on `targetTransform`. Set only for the
   * card travelling to the middle, whose arrival releases the next draw.
   */
  onArrived: (() => void) | null;
};

/**
 * One card on the table. It animates from the deck into the hand, travels to
 * the middle when played, and falls off the bottom of the screen when a newer
 * card takes its place.
 */
export function SingleCardOnTable({
  card,
  targetTransform,
  stackingOrder,
  viewportSize,
  movementTransition,
  onPlay,
  onArrived,
}: SingleCardOnTableProps) {
  const isPlayable = onPlay !== null;

  return (
    // The outer element owns the position on the table; the inner one owns the
    // hover lift, so the two animations never fight over the same transform.
    <motion.div
      onClick={onPlay ?? undefined}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: CARD_WIDTH_IN_PIXELS,
        height: CARD_HEIGHT_IN_PIXELS,
        transformOrigin: "bottom center",
        cursor: isPlayable ? "pointer" : "default",
        zIndex: stackingOrder,
      }}
      initial={{ ...DEAL_IN_START_TRANSFORM, opacity: 0 }}
      animate={{ ...targetTransform, opacity: 1 }}
      // Only reached when the table is cleared for a new deck: a played card
      // stays on the pile rather than leaving the screen.
      exit={{
        y: getCardOffScreenY(viewportSize),
        opacity: 0,
        transition: CLEAR_TABLE_FALL,
      }}
      transition={movementTransition}
      onAnimationComplete={onArrived ?? undefined}
    >
      <motion.div
        whileHover={isPlayable ? { y: -HOVER_LIFT_IN_PIXELS } : undefined}
        style={{ width: "100%", height: "100%" }}
      >
        <Image
          src={getCardImagePath(card)}
          width={CARD_WIDTH_IN_PIXELS}
          height={CARD_HEIGHT_IN_PIXELS}
          alt={getCardFrenchLabel(card)}
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}
