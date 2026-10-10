import type { ReactNode } from "react";

export type CardRuleData = {
  name: string;
  imagePath: string;
  values: number[];
  text: ReactNode;
};

/** The rule of every card: shown on the rules page, and in game for the tutorial. */
export const CARD_RULES: CardRuleData[] = [
  {
    name: "Ace",
    imagePath: "/cards/card_heart_1.png",
    values: [1],
    text: (
      <>
        Move forward 1 <strong>or</strong> bring a pawn out of the starting zone.
      </>
    ),
  },
  {
    name: "King",
    imagePath: "/cards/card_spade_13.png",
    values: [13],
    text: (
      <>
        Move forward 13 <strong>or</strong> bring a pawn out of the starting zone.
      </>
    ),
  },
  {
    name: "Queen",
    imagePath: "/cards/card_diamond_12.png",
    values: [12],
    text: "Move forward 12.",
  },
  {
    name: "Jack",
    imagePath: "/cards/card_clubs_11.png",
    values: [11],
    text: "Swap any two pawns of your choice on the board.",
  },
  {
    name: "7",
    imagePath: "/cards/card_heart_7.png",
    values: [7],
    text: "Split 7 steps between one or more of your pawns. You kill every pawn you pass over.",
  },
  {
    name: "5",
    imagePath: "/cards/card_diamond_5.png",
    values: [5],
    text: (
      <>
        Move <strong>the opponent&apos;s pawn</strong> of your choice forward 5 on the board.
      </>
    ),
  },
  {
    name: "4",
    imagePath: "/cards/card_spade_4.png",
    values: [4],
    text: (
      <>
        Move <strong>backward</strong> 4.
      </>
    ),
  },
  {
    name: "2, 3, 6, 8, 9, 10",
    imagePath: "/cards/card_clubs_8.png",
    values: [2, 3, 6, 8, 9, 10],
    text: "Move forward as many cells as the number on the card.",
  },
];

export function cardRuleOf(value: number): CardRuleData | undefined {
  return CARD_RULES.find((rule) => rule.values.includes(value));
}
