import { Game, GameAction, Seat } from "../../game.types";
import { getLegalActions } from "../legalMoves";

// Joue un coup legal au hasard.
export function chooseEasyAIAction(game: Game, seat: Seat): GameAction | null
{
	const legalMoves: GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);

	if (legalMoves.length === 0)
		return (null);
	return (legalMoves[Math.floor(Math.random() * legalMoves.length)]);
}
