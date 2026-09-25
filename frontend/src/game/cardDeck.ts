/**
 * How a card from the server looks on screen: artwork and name.
 */

import type { Card, CardColor, CardId, CardValue } from "@/game/gameTypes";

/* ************************************************************************** */
/*                                 CONST DEFS                                 */
/* ************************************************************************** */

/** Suit name used in the artwork filenames — note the plural for clubs. */
const COLOR_IMAGE_TOKEN: Record<CardColor, string> = {
  spade: "spade",
  heart: "heart",
  diamond: "diamond",
  club: "clubs",
};

const COLOR_FRENCH_LABEL: Record<CardColor, string> = {
  spade: "pique",
  heart: "cœur",
  diamond: "carreau",
  club: "trèfle",
};

const VALUE_FRENCH_LABEL: Record<CardValue, string> = {
  1: "As", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "Valet", 12: "Dame", 13: "Roi",
};

/* ************************************************************************** */
/*                                  ARTWORK                                   */
/* ************************************************************************** */

/** Path of the card's image inside `public/`. The artwork numbers 1 to 13 too. */
export function getCardImagePath(card: Card): string {
  return `/card_${COLOR_IMAGE_TOKEN[card.color]}_${card.value}.png`;
}

export function getCardFrenchLabel(card: Card): string {
  return `${VALUE_FRENCH_LABEL[card.value]} de ${COLOR_FRENCH_LABEL[card.color]}`;
}

/** Same as the backend's cardValueOf: "heart_12" -> 12. */
export function getCardValueFromId(cardId: CardId): number {
  return Number(cardId.split("_")[1]);
}
