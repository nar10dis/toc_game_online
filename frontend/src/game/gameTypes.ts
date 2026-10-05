/**
 * Copy of the backend types (backend/src/game/game.types.ts).
 * The backend is the reference: if it changes there, change it here.
 */

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardColor = "heart" | "club" | "spade" | "diamond";
export type CardId = `${CardColor}_${CardValue}`;

export type Card = {
  id: CardId;
  color: CardColor;
  value: CardValue;
};

export type Seat = 0 | 1 | 2 | 3;

// board: cell 0 to 71, the same for everyone. home: cell 0 (door) to 3.
export type PawnPosition =
  | { zone: "spawn" }
  | { zone: "board"; cell: number }
  | { zone: "home"; cell: number };

export type Pawn = {
  id: number;
  playerSeat: Seat;
  position: PawnPosition;
};

export type GamePhase = "waiting" | "playing" | "finished";

export type PlayerView = {
  // null for a bot
  userId: number | null;
  pseudo: string;
  seat: Seat;
  // false: the player left, the AI plays for them until they come back
  isConnected: boolean;
  handCount: number;
};

/** The game as the server lets ME see it: only my hand, no draw pile. */
export type GameView = {
  id: number;
  inviteCode: string;
  phase: GamePhase;
  players: PlayerView[];
  pawns: Pawn[];
  discardPile: Card[];
  currentSeat: Seat;
  winner: Seat | null;
  mySeat: Seat;
  myHand: Card[];
  drawPileCount: number;
};

export type SplitStep = { pawnId: number; steps: number };

export type GameAction =
  | { type: "move"; cardId: CardId; pawnId: number }
  | { type: "enter"; cardId: CardId; pawnId: number }
  | { type: "exit"; cardId: CardId; pawnId: number }
  | { type: "swap"; cardId: CardId; pawnIdA: number; pawnIdB: number }
  | { type: "split"; cardId: CardId; steps: SplitStep[] }
  | { type: "discard"; cardId: CardId };

/** What just happened, so we know what to animate. */
export type GameEvent = {
  seat: Seat;
  action: GameAction;
  captured: Pawn[];
  newRound: boolean;
};

/** Payload of the 'state' socket message. */
export type StateMessage = {
  state: GameView;
  event: GameEvent | null;
};

/** Answer of the server to an 'action' message. */
export type ActionAnswer = { ok: true } | { error: string };
