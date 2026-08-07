/**
 * Where every card on the table sits on screen: the fan the player holds at
 * the bottom, and the pile of played cards in the middle.
 *
 * Pure geometry: no React, no animation library. Every position is absolute,
 * in pixels, measured from the top-left corner of the viewport — the cards are
 * rendered as `position: fixed` elements at (0, 0) and moved with a transform.
 */

/** Rendered size of a card, in pixels. */
export const CARD_WIDTH_IN_PIXELS = 125;
export const CARD_HEIGHT_IN_PIXELS = 200;

/** How many cards the player may hold at once. */
export const MAX_CARDS_IN_HAND = 5;

/** Horizontal gap between two neighbouring cards of the fan. */
const FAN_HORIZONTAL_SPREAD_IN_PIXELS = 70;

/** How far a card drops per slot away from the middle of the fan. */
const FAN_ARC_DROP_IN_PIXELS = 12;

/** How much a card rotates per slot away from the middle of the fan. */
const FAN_TILT_IN_DEGREES = 7;

/** Gap between the bottom of the fan and the bottom of the screen. */
const FAN_BOTTOM_MARGIN_IN_PIXELS = 24;

/** How much bigger a played card is drawn, to set the pile apart from the hand. */
const PLAYED_CARD_SCALE = 1.15;

/**
 * How far a played card may lean from vertical, in degrees, either way. Kept
 * small on purpose: the pile should look hand-stacked, not scattered.
 */
const MAX_PLAYED_CARD_TILT_IN_DEGREES = 5;

/** How far below the screen a leaving card flies before it is unmounted. */
const OFF_SCREEN_DISTANCE_IN_PIXELS = 300;

export type ViewportSize = { width: number; height: number };

/** Placement of a single card on screen. */
export type CardTransform = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
};

/** Left edge a card needs so that it ends up horizontally centred. */
function getHorizontallyCenteredCardX(viewportSize: ViewportSize): number {
  return viewportSize.width / 2 - CARD_WIDTH_IN_PIXELS / 2;
}

/**
 * Resting place of the card sitting at `positionInHand`, in a fan holding
 * `totalCardsInHand` cards.
 *
 * `slotOffsetFromCenter` is the signed distance from the middle of the fan
 * (-1.5, -0.5, 0.5, 1.5 for a hand of four). It drives all three effects at
 * once: cards spread out horizontally, the outer ones drop, and each one tilts
 * a little more than its neighbour.
 */
export function getFannedCardTransform(
  positionInHand: number,
  totalCardsInHand: number,
  viewportSize: ViewportSize,
): CardTransform {
  const slotOffsetFromCenter = positionInHand - (totalCardsInHand - 1) / 2;

  return {
    x:
      getHorizontallyCenteredCardX(viewportSize) +
      slotOffsetFromCenter * FAN_HORIZONTAL_SPREAD_IN_PIXELS,
    y:
      viewportSize.height -
      CARD_HEIGHT_IN_PIXELS -
      FAN_BOTTOM_MARGIN_IN_PIXELS +
      Math.abs(slotOffsetFromCenter) * FAN_ARC_DROP_IN_PIXELS,
    rotate: slotOffsetFromCenter * FAN_TILT_IN_DEGREES,
    scale: 1,
  };
}

/**
 * A random lean for a card about to join the pile. Drawn once, when the card
 * is played, and kept from then on — re-rolling it every render would make the
 * whole pile twitch.
 */
export function pickRandomPlayedCardTilt(): number {
  return (Math.random() * 2 - 1) * MAX_PLAYED_CARD_TILT_IN_DEGREES;
}

/**
 * Middle of the screen, where played cards pile up. Every card lands on the
 * same spot; only `tiltInDegrees` tells them apart, so the pile reads as a
 * stack of real cards rather than one perfectly aligned block.
 */
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

/**
 * Where a freshly drawn card starts: small and tilted in the top-left corner,
 * so that it appears to be dealt from the deck into the hand.
 */
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
