import { Game, GameAction, Seat, isAI, Pawn, BOARD_CELLS_COUNT} from "../game.types";
import { getLegalActions } from "./legalMoves";
import { playTurn } from "./state";
import { applyAction } from "./apply";
import { distanceToHome } from "./board";

//valeur du score depend de la distance a la maison !
//si je tue qqun a deux case de chez lui -> +70 (nbre de case - 2)
function scoreAction(pawns : Pawn[], seat: Seat, action: GameAction) : number
{
	if (action.type === 'discard')
		return -1;

	const after = applyAction(pawns, seat, action);
	let score = 0;

	for (const pawn of after.captured)
	{
		if (pawn.playerSeat === seat)
			score -= 100;
		else if (pawn.position.zone === 'board')
			score += BOARD_CELLS_COUNT - distanceToHome(pawn.playerSeat, pawn.position.cell);
	}
	for (const newPawn of after.pawns && const oldPawn of pawns)
	{

	}
	return score;
}

export function chooseAIAction(game: Game, seat: Seat) : GameAction | null {
	const legalMoves : GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);
	let best: GameAction | null = null;
	let bestScore = -Infinity;

	for (const action of legalMoves)
	{
		const score = scoreAction(game.pawns, seat, action);
		if (score > bestScore)
		{
			best = action;
			bestScore = score;
		}
	}
	return best;
}

//runBots
