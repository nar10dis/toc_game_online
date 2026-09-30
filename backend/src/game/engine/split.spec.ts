import { Card, Game, Pawn, Player, Seat } from '../game.types';
import { chooseAIAction } from './AI';
import { getLegalActions } from './legalMoves';
import { canFinishSplit, getSplitSteps } from './split';
import { playTurn } from './state';

const SEVEN: Card = { id: 'heart_7', color: 'heart', value: 7 };
const EIGHT: Card = { id: 'heart_8', color: 'heart', value: 8 };

function onBoard(id: number, playerSeat: Seat, cell: number): Pawn {
  return { id, playerSeat, position: { zone: 'board', cell } };
}

function inSpawn(id: number, playerSeat: Seat): Pawn {
  return { id, playerSeat, position: { zone: 'spawn' } };
}

// Une partie en cours ou le siege 0 a le 7 (et un 8 pour que la manche ne finisse pas).
function makeGame(pawns: Pawn[]): Game {
  const players: Player[] = [0, 1, 2, 3].map((seat) => ({
    userId: seat === 0 ? 1 : null,
    pseudo: `P${seat}`,
    seat: seat as Seat,
    hand: seat === 0 ? [SEVEN, EIGHT] : [EIGHT],
    isConnected: true,
  }));

  return {
    id: 1,
    inviteCode: 'TEST',
    phase: 'playing',
    players,
    // chaque siege a au moins un pion, sinon checkWinner le croit gagnant
    pawns: [...pawns, inSpawn(101, 1), inSpawn(102, 2), inSpawn(103, 3)],
    drawPile: [],
    discardPile: [],
    currentSeat: 0,
    winner: null,
    pendingSplit: null,
  };
}

function positionOf(game: Game, pawnId: number) {
  return game.pawns.find((pawn) => pawn.id === pawnId)!.position;
}

describe('le 7 (split)', () => {
  it('3 + 4 sur deux pions, puis tour suivant', () => {
    let game = makeGame([onBoard(0, 0, 10), onBoard(1, 0, 30), inSpawn(2, 0), inSpawn(3, 0)]);

    const first = playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 0, steps: 3, enter: false });
    expect(first).not.toBeNull();
    game = first!.game;
    expect(positionOf(game, 0)).toEqual({ zone: 'board', cell: 13 });
    expect(game.pendingSplit).toEqual({ cardId: 'heart_7', left: 4 });
    expect(game.currentSeat).toBe(0);
    // la carte est posee des le premier morceau
    expect(game.players[0].hand).toEqual([EIGHT]);
    expect(game.discardPile).toEqual([SEVEN]);

    const second = playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 1, steps: 4, enter: false });
    expect(second).not.toBeNull();
    game = second!.game;
    expect(positionOf(game, 1)).toEqual({ zone: 'board', cell: 34 });
    expect(game.pendingSplit).toBeNull();
    expect(game.currentSeat).toBe(1);
  });

  it('pendant un 7, on ne peut pas jouer une autre carte', () => {
    let game = makeGame([onBoard(0, 0, 10), onBoard(1, 0, 30), inSpawn(2, 0), inSpawn(3, 0)]);

    game = playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 0, steps: 3, enter: false })!.game;
    expect(playTurn(game, 0, { type: 'move', cardId: 'heart_8', pawnId: 0 })).toBeNull();
    // et on ne peut pas depasser les pas restants
    expect(playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 0, steps: 5, enter: false })).toBeNull();
  });

  it('capture un pion adverse ET un des siens sur le chemin', () => {
    const game = makeGame([onBoard(0, 0, 10), onBoard(1, 0, 13), inSpawn(2, 0), inSpawn(3, 0), onBoard(4, 1, 11)]);

    const out = playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 0, steps: 7, enter: false })!;
    expect(out.event.captured.map((pawn) => pawn.id).sort()).toEqual([1, 4]);
    expect(positionOf(out.game, 1)).toEqual({ zone: 'spawn' });
    expect(positionOf(out.game, 4)).toEqual({ zone: 'spawn' });
    expect(positionOf(out.game, 0)).toEqual({ zone: 'board', cell: 17 });
  });

  it("en rentrant a la maison, capture sur les cases du plateau avant l'entree", () => {
    // siege 0 : entree de la maison apres la case 69
    const game = makeGame([onBoard(0, 0, 66), inSpawn(1, 0), inSpawn(2, 0), inSpawn(3, 0), onBoard(4, 1, 68)]);

    const out = playTurn(game, 0, { type: 'split', cardId: 'heart_7', pawnId: 0, steps: 5, enter: true })!;
    expect(out.event.captured.map((pawn) => pawn.id)).toEqual([4]);
    expect(positionOf(out.game, 0)).toEqual({ zone: 'home', cell: 1 });
    expect(out.game.pendingSplit).toEqual({ cardId: 'heart_7', left: 2 });
  });

  it('ne propose pas un morceau qui menerait a un blocage', () => {
    // pion 0 a la maison case 0, case 3 occupee : 2 pas maximum.
    // pion 1 en case 16 : bloque des 2 pas par le pion du siege 1 sur sa sortie (18).
    // Au total on peut faire 3 pas maximum, jamais 7.
    const pawns = [
      { id: 0, playerSeat: 0 as Seat, position: { zone: 'home' as const, cell: 0 } },
      { id: 3, playerSeat: 0 as Seat, position: { zone: 'home' as const, cell: 3 } },
      onBoard(1, 0, 16),
      inSpawn(2, 0),
      onBoard(4, 1, 18),
    ];

    expect(canFinishSplit(pawns, 0, 7)).toBe(false);
    expect(getSplitSteps(pawns, 0, 'heart_7', 7)).toEqual([]);
    // avec 3 pas restants : 2 (pion 0) + 1 (pion 1) marche,
    // mais aucun pion ne peut faire les 3 pas d'un coup.
    const steps = getSplitSteps(pawns, 0, 'heart_7', 3);
    expect(steps.some((step) => step.type === 'split' && step.steps === 3)).toBe(false);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('7 injouable : on peut le defausser', () => {
    const pawns = [inSpawn(0, 0), inSpawn(1, 0), inSpawn(2, 0), inSpawn(3, 0)];
    const legal = getLegalActions([SEVEN], pawns, 0, null);

    expect(legal).toEqual([{ type: 'discard', cardId: 'heart_7' }]);
  });

  it("l'IA enchaine les morceaux jusqu'a finir le 7", () => {
    let game = makeGame([onBoard(0, 0, 10), onBoard(1, 0, 30), inSpawn(2, 0), inSpawn(3, 0)]);
    game = { ...game, players: game.players.map((p) => ({ ...p, hand: p.seat === 0 ? [SEVEN] : [EIGHT] })) };

    let total = 0;
    do {
      const action = chooseAIAction(game, 0)!;
      expect(action.type).toBe('split');
      if (action.type === 'split')
        total += action.steps;
      game = playTurn(game, 0, action)!.game;
    } while (game.pendingSplit !== null);

    expect(total).toBe(7);
    expect(game.currentSeat).toBe(1);
  });
});
