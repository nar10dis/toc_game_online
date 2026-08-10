/**
 * The cards themselves: creation, shuffling and artwork.
 */

/* ************************************************************************** */
/*                                 TYPE DEFS                                  */
/* ************************************************************************** */

export type CardRank =
  | "As" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "Valet" | "Dame" | "Roi";

export type CardSuit = "spade" | "heart" | "diamond" | "club";

export type Card = { rank: CardRank; suit: CardSuit };

/** Cards left to draw, topmost last. */
export type Deck = Card[];

/* ************************************************************************** */
/*                                 CONST DEFS                                 */
/* ************************************************************************** */

/** How many full 52-card sets are shuffled together into one deck. */
const DECKS_NUMBER = 2;

const ALL_CARD_RANKS: CardRank[] = [
  "As", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "Valet", "Dame", "Roi",
];

const ALL_CARD_SUITS: CardSuit[] = ["spade", "heart", "diamond", "club"];

/** Suit name used in the artwork filenames — note the plural for clubs. */
const SUIT_IMAGE_TOKEN: Record<CardSuit, string> = {
  spade: "spade",
  heart: "heart",
  diamond: "diamond",
  club: "clubs",
};

/** The artwork numbers ranks from 1 (ace) to 13 (king). */
const RANK_IMAGE_NUMBER: Record<CardRank, number> = {
  As: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, Valet: 11, Dame: 12, Roi: 13,
};

/** Suit name shown to the player, used to describe the card out loud. */
const SUIT_FRENCH_LABEL: Record<CardSuit, string> = {
  spade: "pique",
  heart: "cœur",
  diamond: "carreau",
  club: "trèfle",
};

/* ************************************************************************** */
/*                                  ARTWORK                                   */
/* ************************************************************************** */

/** Path of the card's image inside `public/`. */
export function getCardImagePath(card: Card): string {
  return `/card_${SUIT_IMAGE_TOKEN[card.suit]}_${RANK_IMAGE_NUMBER[card.rank]}.png`;
}

/** How many cells the card moves a pawn: 1 for the ace, up to 13 for the king. */
export function getCardMoveDistance(card: Card): number {
  return RANK_IMAGE_NUMBER[card.rank];
}

export function getCardFrenchLabel(card: Card): string {
  return `${card.rank} de ${SUIT_FRENCH_LABEL[card.suit]}`;
}

/* ************************************************************************** */
/*                                  DECK INIT                                 */
/* ************************************************************************** */

/** Fisher-Yates shuffle */
function shuffleDeckInPlace(deck: Deck): Deck {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** DECKS_NUMBER full 52-card sets shuffled together, so ranks can repeat. */
export function createShuffledDeck(): Deck {
  const deck: Deck = [];

  for (let set = 0; set < DECKS_NUMBER; set++) {
    for (const suit of ALL_CARD_SUITS) {
      for (const rank of ALL_CARD_RANKS) deck.push({ rank, suit });
    }
  }
  return shuffleDeckInPlace(deck);
}
