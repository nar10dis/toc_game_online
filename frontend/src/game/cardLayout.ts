/**
 * Where every card sits on screen, and how it travels there.
 *
 * Pure geometry: no React. Every position is absolute, in pixels, measured
 * from the top-left corner of the table — the area laid over the board. The
 * cards are `position: absolute` elements at (0, 0) moved with a transform, so
 * they scroll and zoom together with the board.
 */

import type { Transition } from "motion/react";

/* ************************************************************************** */
/*                                  TYPE DEF                                  */
/* ************************************************************************** */

export type TableSize = { width: number; height: number };

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
/** Height of a card of the hand, as a share of the board height. */
const CARD_HEIGHT_SHARE_OF_TABLE = 0.12;

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

/** When the discard pile is shuffled back into the deck. */
export const CLEAR_TABLE_FALL: Transition = {
  duration: 0.45,
  ease: [0.55, 0, 1, 0.45],
};

/* ************************************************************************** */
/*                               GEOMETRY FUNC                                */
/* ************************************************************************** */

// the cards follow the board size, so both grow and shrink together on zoom.
export function getCardScale(tableSize: TableSize): number {
  const cardHeight = tableSize.height * CARD_HEIGHT_SHARE_OF_TABLE;
  return cardHeight / CARD_HEIGHT_IN_PIXELS;
}

function getHorizontallyCenteredCardX(tableSize: TableSize): number {
  return tableSize.width / 2 - CARD_WIDTH_IN_PIXELS / 2;
}

export function getHandCardTransform(
  positionInHand: number,
  totalCardsInHand: number,
  tableSize: TableSize,
): CardTransform {
  //normalize number from the center of the hand !
  const slotOffsetFromCenter = positionInHand - (totalCardsInHand - 1) / 2;
  const cardScale = getCardScale(tableSize);

  return {
    //calcule l'ecartement gauche - droite
    x:
      getHorizontallyCenteredCardX(tableSize) +
      slotOffsetFromCenter * HAND_HORIZONTAL_SPREAD_IN_PIXELS * cardScale,
    //calcule chute en arc + inclinaison.
    //abs sur le normalized sinon on a diagonale.
    //the card scales from its bottom edge, so only the margin and drop shrink.
    y:
      tableSize.height -
      CARD_HEIGHT_IN_PIXELS -
      HAND_BOTTOM_MARGIN_IN_PIXELS * cardScale +
      Math.abs(slotOffsetFromCenter) * HAND_ARC_DROP_IN_PIXELS * cardScale,
    rotate: slotOffsetFromCenter * HAND_TILT_IN_DEGREES,
    scale: cardScale,
  };
}

//same card, same tilt: computed from its id so it never jiggles on re-render.
export function getPlayedCardTilt(cardId: string): number {
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    hash = (hash * 31 + cardId.charCodeAt(i)) % 1000;
  }
  return (hash / 1000 * 2 - 1) * PLAYED_CARD_MAX_TILT;
}

export function getPlayedCardTransform(
  tableSize: TableSize,
  tiltInDegrees: number,
): CardTransform {
  const scale = PLAYED_CARD_SCALE * getCardScale(tableSize);
  const scaledCardHeight = CARD_HEIGHT_IN_PIXELS * scale;

  //the card scales from its bottom edge: place that edge so its middle sits mid-screen.
  return {
    x: getHorizontallyCenteredCardX(tableSize),
    y: tableSize.height / 2 + scaledCardHeight / 2 - CARD_HEIGHT_IN_PIXELS,
    rotate: tiltInDegrees,
    scale,
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
export function getCardOffScreenY(tableSize: TableSize): number {
  return tableSize.height + OFF_SCREEN_DISTANCE_IN_PIXELS;
}
