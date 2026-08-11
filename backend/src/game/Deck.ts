type CardValue =
  | "As" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "Valet" | "Dame" | "Roi";


type CardColor =
	| "Pique"
	| "Coeur"
	| "Carreau"
	| "Trefle";

type Card = { value: CardValue; color: CardColor};

type Deck = Card[];
