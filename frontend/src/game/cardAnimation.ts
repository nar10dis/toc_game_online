/**
 * How long each card movement takes and how it eases.
 *
 * Separate from `cardTableLayout`, which decides *where* a card goes: this
 * module only decides *how it gets there*.
 */

import type { Transition } from "motion/react";

/**
 * Cards moving inside the hand: dealt in from the deck, and shuffling sideways
 * to close the gap when a neighbour is played. A lively spring suits these
 * short hops.
 */
export const HAND_CARD_MOVEMENT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

/**
 * A card travelling from its slot in the hand to the pile in the middle.
 *
 * An eased tween rather than a spring: the journey is long, so the spring's
 * overshoot reads as a wobble, and a tween settles at a known moment. That
 * matters here — the replacement card is only drawn once this has finished.
 */
export const PLAYED_CARD_TRAVEL: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

/**
 * Cards sweeping off the bottom of the screen when the table is cleared for a
 * new deck. Nothing leaves the table during normal play — played cards stay on
 * the pile — so this only ever runs on "Nouveau paquet".
 */
export const CLEAR_TABLE_FALL: Transition = {
  duration: 0.45,
  ease: [0.55, 0, 1, 0.45],
};
