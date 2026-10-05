import { Game, GameAction, GameView, LegalMove, Pawn, PawnPosition, Seat } from "../game.types";
import { applyAction } from "./apply";
import { findPawn, getLegalActions } from "./legalMoves";

// Ou le coup pose le pion joue : on le joue pour de faux et on regarde.
function destinationOf(pawns: Pawn[], seat: Seat, action: GameAction): PawnPosition | null {
	if (action.type === 'swap' || action.type === 'discard')
		return null;

	const after = applyAction(pawns, seat, action);

	return findPawn(after.pawns, action.pawnId)?.position ?? null;
}

// Mes coups legaux, pour que le front n'ait pas a connaitre les regles.
function legalMovesFor(game: Game, seat: Seat): LegalMove[] {
	if (game.phase !== 'playing' || game.currentSeat !== seat)
		return [];

	const actions = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);

	return actions.map(action => ({ action, to: destinationOf(game.pawns, seat, action) }));
}

// La partie vue depuis un siege : on cache la pioche et la main des autres.
export function viewFor(game: Game, seat: Seat): GameView {
	const { drawPile, players, ...rest } = game;

	return {
		...rest,
		mySeat: seat,
		myHand: players[seat].hand,
		players: players.map(({ hand, ...player }) => ({ ...player, handCount: hand.length })),
		drawPileCount: drawPile.length,
		legalMoves: legalMovesFor(game, seat),
	};
}
