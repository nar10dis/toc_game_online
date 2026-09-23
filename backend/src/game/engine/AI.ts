import { Game, GameAction, Seat, isAI } from "../game.types";
import { getLegalActions } from "./legalMoves";
import { playTurn } from "./state";

// IA de test : choisit un coup legal au hasard.
// null = aucun coup possible (main vide), ne devrait pas arriver en cours de partie.
export function chooseAIAction(game: Game, seat: Seat) : GameAction | null {
	const legalMoves : GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat);

	if (legalMoves.length === 0)
		return null;
	return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

// Fait jouer les IA a la suite jusqu'au prochain humain (ou la fin de partie).
export function playAITurns(game: Game) : Game {
	while (game.phase === 'playing' && isAI(game.players[game.currentSeat]))
	{
		const seat = game.currentSeat;
		const aiAction = chooseAIAction(game, seat);
		if (!aiAction)
			break;
		const out = playTurn(game, seat, aiAction);
		if (!out)
			break; //securite, ne devrait pas arriver
		game = out.game;
	}
	return game;
}
