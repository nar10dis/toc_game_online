/**
 * A standard 52-card deck: creation, shuffling, drawing and card artwork.
 *
 * Decks are kept in a module-level registry so that a deck keeps its remaining
 * cards across React re-renders. Several independent decks can coexist, each
 * identified by a `deckId`.
 */

export type CardRank =
  | "As" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "Valet" | "Dame" | "Roi";

export type CardSuit = "spade" | "heart" | "diamond" | "club";

export type Card = { rank: CardRank; suit: CardSuit };

export type Deck = Card[];

/** Deck used when no explicit `deckId` is given. */
export const DEFAULT_DECK_ID = 0;

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

/** Path of the card's image inside `public/`. */
export function getCardImagePath(card: Card): string {
  return `/card_${SUIT_IMAGE_TOKEN[card.suit]}_${RANK_IMAGE_NUMBER[card.rank]}.png`;
}

/** Human-readable name of the card, e.g. "As de pique". */
export function getCardFrenchLabel(card: Card): string {
  return `${card.rank} de ${SUIT_FRENCH_LABEL[card.suit]}`;
}

/**
 * Stable identifier for a card. A deck holds at most one of each
 * rank/suit combination, so this uniquely identifies a card in play.
 */
export function getCardId(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

/** Fisher-Yates shuffle, in place. */
function shuffleDeckInPlace(deck: Deck): Deck {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** A fresh, shuffled 52-card deck. */
export function createShuffledDeck(): Deck {
  const deck: Deck = [];
  for (const suit of ALL_CARD_SUITS) {
    for (const rank of ALL_CARD_RANKS) deck.push({ rank, suit });
  }
  return shuffleDeckInPlace(deck);
}

const remainingCardsByDeckId: Deck[] = [];

function getOrCreateDeck(deckId: number): Deck {
  remainingCardsByDeckId[deckId] ??= createShuffledDeck();
  return remainingCardsByDeckId[deckId];
}

/** Takes the top card off the deck, or returns `null` once it is exhausted. */
export function drawCardFromDeck(deckId: number = DEFAULT_DECK_ID): Card | null {
  return getOrCreateDeck(deckId).pop() ?? null;
}

/** Replaces the deck with a fresh, shuffled one. */
export function replaceDeckWithFreshOne(deckId: number = DEFAULT_DECK_ID): void {
  remainingCardsByDeckId[deckId] = createShuffledDeck();
}
