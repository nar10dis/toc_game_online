import { Game, GameAction, Seat, isAI } from "../game.types";
import { getLegalActions } from "./legalMoves";
import { playTurn } from "./state";

// IA de test : choisit un coup legal au hasard.
// null = aucun coup possible (main vide), ne devrait pas arriver en cours de partie.
export function chooseAIAction(game: Game, seat: Seat) : GameAction | null {
	const legalMoves : GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);

	if (legalMoves.length === 0)
		return null;
	return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

//runBots
