/**
 * Where every card sits on screen, and how it travels there.
 *
 * Pure geometry: no React. Every position is absolute, in pixels, measured
 * from the top-left corner of the viewport — the cards are rendered as
 * `position: fixed` elements at (0, 0) and moved with a transform.
 */

import type { Transition } from "motion/react";

/* ************************************************************************** */
/*                                  TYPE DEF                                  */
/* ************************************************************************** */

export type ViewportSize = { width: number; height: number };

/** Placement of a single card on screen. */
export type CardTransform = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
};

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

export const CARD_WIDTH_IN_PIXELS = 125;
export const CARD_HEIGHT_IN_PIXELS = 200;
export const MAX_CARDS_IN_HAND = 5;
/** How far a playable card lifts when the pointer hovers it. */
export const HOVER_LIFT_IN_PIXELS = 18;
/** Horizontal gap between two neighbouring cards of the hand. */
const HAND_HORIZONTAL_SPREAD_IN_PIXELS = 70;
/** How far a card drops per slot away from the middle of the hand. */
const HAND_ARC_DROP_IN_PIXELS = 12;
/** How much a card rotates per slot away from the middle of the hand. */
const HAND_TILT_IN_DEGREES = 7;
/** Gap between the bottom of the hand and the bottom of the screen. */
const HAND_BOTTOM_MARGIN_IN_PIXELS = 24;
/** How much bigger a played card is drawn, to set the pile apart from the hand. */
const PLAYED_CARD_SCALE = 1.15;
/** How far a played card may lean from vertical, in degrees, either way. */
const PLAYED_CARD_MAX_TILT = 5;
/** How far below the screen a leaving card flies before it is unmounted. */
const OFF_SCREEN_DISTANCE_IN_PIXELS = 300;

/* ************************************************************************** */
/*                                TRANSITIONS                                 */
/* ************************************************************************** */

/** From the deck to the hand. */
export const HAND_CARD_MOVEMENT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

/** From the hand to the middle. */
export const PLAYED_CARD_TRAVEL: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

/** Only for "Nouveau paquet". */
export const CLEAR_TABLE_FALL: Transition = {
  duration: 0.45,
  ease: [0.55, 0, 1, 0.45],
};

/* ************************************************************************** */
/*                               GEOMETRY FUNC                                */
/* ************************************************************************** */

function getHorizontallyCenteredCardX(viewportSize: ViewportSize): number {
  return viewportSize.width / 2 - CARD_WIDTH_IN_PIXELS / 2;
}

export function getHandCardTransform(
  positionInHand: number,
  totalCardsInHand: number,
  viewportSize: ViewportSize,
): CardTransform {
  //normalize number from the center of the hand !
  const slotOffsetFromCenter = positionInHand - (totalCardsInHand - 1) / 2;

  return {
    //calcule l'ecartement gauche - droite
    x:
      getHorizontallyCenteredCardX(viewportSize) +
      slotOffsetFromCenter * HAND_HORIZONTAL_SPREAD_IN_PIXELS,
    //calcule chute en arc + inclinaison.
    //abs sur le normalized sinon on a diagonale.
    y:
      viewportSize.height -
      CARD_HEIGHT_IN_PIXELS -
      HAND_BOTTOM_MARGIN_IN_PIXELS +
      Math.abs(slotOffsetFromCenter) * HAND_ARC_DROP_IN_PIXELS,
    rotate: slotOffsetFromCenter * HAND_TILT_IN_DEGREES,
    scale: 1,
  };
}

//random = one time -> so that react doesnt re-render everytime.
export function pickRandomPlayedCardTilt(): number {
  return (Math.random() * 2 - 1) * PLAYED_CARD_MAX_TILT;
}

export function getPlayedCardTransform(
  viewportSize: ViewportSize,
  tiltInDegrees: number,
): CardTransform {
  return {
    x: getHorizontallyCenteredCardX(viewportSize),
    y: viewportSize.height / 2 - CARD_HEIGHT_IN_PIXELS / 2,
    rotate: tiltInDegrees,
    scale: PLAYED_CARD_SCALE,
  };
}

/** Original position of the drawn card ! */
export const DEAL_IN_START_TRANSFORM: CardTransform = {
  x: 0,
  y: 0,
  rotate: -20,
  scale: 0.7,
};

/** Vertical position a card slides down to when it leaves the table. */
export function getCardOffScreenY(viewportSize: ViewportSize): number {
  return viewportSize.height + OFF_SCREEN_DISTANCE_IN_PIXELS;
}
