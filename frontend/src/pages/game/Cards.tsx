export type CardValue =
  | "As" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "Valet" | "Dame" | "Roi";
export type CardColor = "spade" | "heart" | "diamond" | "club";
export type Card = { value: CardValue; color: CardColor };
export type Deck = Card[];

const DECK_INDEX = 0;

const VALUES: CardValue[] = [
  "As", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "Valet", "Dame", "Roi",
];
const COLORS: CardColor[] = ["spade", "heart", "diamond", "club"];

const COLOR_TOKEN: Record<CardColor, string> = {
  spade: "spade",
  heart: "heart",
  diamond: "diamond",
  club: "clubs", // pluriel : tes fichiers sont card_clubs_*.png
};

const VALUE_TOKEN: Record<CardValue, number> = {
  As: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, Valet: 11, Dame: 12, Roi: 13,
};

export function getPath(card: Card): string {
  return `/card_${COLOR_TOKEN[card.color]}_${VALUE_TOKEN[card.value]}.png`;
}

function shuffle(deck: Deck): Deck {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createDeck(): Deck {
  const deck: Deck = [];
  for (const color of COLORS) {
    for (const value of VALUES) deck.push({ value, color });
  }
  return shuffle(deck);
}

const decks: Deck[] = [];

function getDeck(deckIndex = DECK_INDEX): Deck {
  decks[deckIndex] ??= createDeck();
  return decks[deckIndex];
}

export function drawCard(deckIndex = DECK_INDEX): Card | null {
  return getDeck(deckIndex).pop() ?? null;
}

export function resetDeck(deckIndex = DECK_INDEX): void {
  decks[deckIndex] = createDeck();
}
