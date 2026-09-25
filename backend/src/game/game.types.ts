/* ************************************************************************** */
/*                                 1. CARD                                    */
/* ************************************************************************** */
export const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export const CARD_COLORS: CardColor[] = ['heart', 'club', 'spade', 'diamond'];

export type CardValue = (typeof CARD_VALUES)[number];
export type CardColor = 'heart' | 'club' | 'spade' | 'diamond';
//template literal type !
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
export const HOME_CELLS_COUNT = 4;

// board : cell 0 -> 71, case absolue du tour, identique pour tous les joueurs.
// home  : cell 0 -> 3, 0 = l'entree (cote plateau), 3 = le fond.
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
  // null = place tenue par l'IA, elle n'a pas de compte
  userId: number | null;
  pseudo: string;
  seat: Seat;
  hand: Card[];
  isConnected: boolean;
};

export const isAI = (player: Player): boolean => player.userId === null;

/* ************************************************************************** */
/*                                 5. GAME                                    */
/* ************************************************************************** */
export type GamePhase = 'waiting' | 'playing' | 'finished';

export type Game = {
  id: number;
  inviteCode: string;
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
  | { type: 'enter'; cardId: CardId; pawnId: number }
  | { type: 'exit'; cardId: CardId; pawnId: number }
  | { type: 'swap'; cardId: CardId; pawnIdA: number; pawnIdB: number }
  | { type: 'split'; cardId: CardId; steps: SplitStep[] }
  | { type: 'discard'; cardId: CardId };

/* ************************************************************************** */
/*                                 7. RESEAU                                  */
/* ************************************************************************** */
// Ce qui vient de se passer, pour que le front sache quoi animer.
export type GameEvent = {
  seat: Seat;
  action: GameAction;
  captured: Pawn[];
  newRound: boolean;
};

// Ce qu'un joueur a le droit de voir : pas la main des autres, pas la pioche.
export type PlayerView = Omit<Player, 'hand'> & { handCount: number };

export type GameView = Omit<Game, 'players' | 'drawPile'> & {
  mySeat: Seat;
  myHand: Card[];
  players: PlayerView[];
  drawPileCount: number;
};

// Le message 'state' envoye a chaque commit.
export type StateMessage = {
  state: GameView;
  event: GameEvent | null;
};
