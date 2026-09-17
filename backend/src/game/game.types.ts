/* ************************************************************************** */
/*                                 1. CARD                                    */
/* ************************************************************************** */
export const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export const CARD_COLORS: CardColor[] = ['heart', 'club', 'spade', 'diamond'];
export type CardValue = (typeof CARD_VALUES)[number];
export type CardColor = 'heart' | 'club' | 'spade' | 'diamond';
//template iteral type !
export type CardId = `${CardColor}_${CardValue}`;

export type Card = {
  id: CardId;
  color: CardColor;
  value: CardValue;
};

/* ************************************************************************** */
/*                                 2. SEAT                                    */
/* ************************************************************************** */
export type Seat = 0 | 1 | 2 | 3;

/* ************************************************************************** */
/*                                 3. PAWN                                    */
/* ************************************************************************** */
export const BOARD_CELLS_COUNT = 72;

export type PawnPosition =
  | { zone: 'spawn' }
  | { zone: 'board'; cell: number }
  | { zone: 'home'; cell: number };

export type Pawn = {
  position: PawnPosition;
  id: number;
  playerSeat: Seat;
};

/* ************************************************************************** */
/*                                 4. PLAYER                                  */
/* ************************************************************************** */
export type Player = {
  userId: number;
  pseudo: string;
  seat: Seat;
  hand: Card[];
  isConnected: boolean;
};

/* ************************************************************************** */
/*                                 5. GAME                                    */
/* ************************************************************************** */
export type GamePhase = 'waiting' | 'playing' | 'finished';

export type Game = {
  id: number;
  phase: GamePhase;
  players: Player[];
  pawns: Pawn[];
  drawPile: Card[];
  discardPile: Card[];
  currentSeat: Seat;
  winner: Seat | null;
};

/* ************************************************************************** */
/*                                 6. ACTIONS                                 */
/* ************************************************************************** */
export type SplitStep = {
  pawnId: number;
  steps: number;
};

export type GameAction =
  | { type: 'move'; cardId: CardId; pawnId: number }
  | { type: 'exit'; cardId: CardId; pawnId: number }
  | { type: 'swap'; cardId: CardId; pawnIdA: number; pawnIdB: number }
  // 1 to 4 steps, adding up to exactly 7
  | { type: 'split'; cardId: CardId; steps: SplitStep[] }
  | { type: 'discard'; cardId: CardId };
