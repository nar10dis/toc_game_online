import { Pawn, Seat, CardId, GameAction, BOARD_CELLS_COUNT } from "../game.types"
import { ActionResult, captureAt, setPawnPosition } from "./apply"
import { getStartHome, homeCellIndex, pathCells, pawnsOf } from "./board"
import { canGoHome, canMove, canMoveInHome } from "./rules"
import { mod } from "./utils"

// LE 7 : on partage 7 pas entre ses pions, un emit par morceau.
// Il capture TOUS les pions sur son passage, les siens compris.

function captureAlongPath(pawns: Pawn[], from: number, steps: number) : ActionResult {
	let captured : Pawn[] = [];

	for (const cell of pathCells(from, steps))
	{
		const hit = captureAt(pawns, cell);

		pawns = hit.pawns;
		captured = captured.concat(hit.captured);
	}
	return {pawns, captured};
}

// Joue un morceau du 7 sans toucher au vrai plateau : renvoie le plateau d'apres.
// null = morceau interdit.
export function simulateSplitStep(pawns: Pawn[], pawn: Pawn, steps: number, enter: boolean) : ActionResult | null {

	if (!Number.isInteger(steps) || steps <= 0)
		return null;

	if (enter)
	{
		if (!canGoHome(pawns, steps, pawn) || pawn.position.zone !== 'board')
			return null;

		// on capture seulement sur les cases du plateau, avant d'entrer dans la maison
		const toEntry = mod(getStartHome(pawn.playerSeat) - pawn.position.cell, BOARD_CELLS_COUNT);
		const hit = captureAlongPath(pawns, pawn.position.cell, toEntry);
		const target = homeCellIndex(pawn.playerSeat, pawn.position.cell, steps);

		return ({
			pawns: setPawnPosition(hit.pawns, pawn.id, {zone: 'home', cell: target}),
			captured: hit.captured,
		});
	}

	if (pawn.position.zone === 'home')
	{
		if (!canMoveInHome(pawns, steps, pawn))
			return null;
		return ({
			pawns: setPawnPosition(pawns, pawn.id, {zone: 'home', cell: pawn.position.cell + steps}),
			captured: [],
		});
	}

	if (!canMove(pawns, steps, pawn) || pawn.position.zone !== 'board')
		return null;

	const hit = captureAlongPath(pawns, pawn.position.cell, steps);
	const target = mod(pawn.position.cell + steps, BOARD_CELLS_COUNT);

	return ({
		pawns: setPawnPosition(hit.pawns, pawn.id, {zone: 'board', cell: target}),
		captured: hit.captured,
	});
}

// Les morceaux jouables maintenant. Le 7 n'a pas besoin d'etre fini :
// si plus rien n'est jouable, les pas qui restent sont perdus (voir playTurn).
export function getSplitSteps(pawns: Pawn[], seat: Seat, cardId: CardId, left: number) : GameAction[] {
	const splitSteps : GameAction[] = [];

	for (const pawn of pawnsOf(pawns, seat))
	{
		// du plus grand au plus petit : a score egal, l'IA prend le plus gros morceau
		for (let steps = left; steps >= 1; steps--)
		{
			for (const enter of [false, true])
			{
				const after = simulateSplitStep(pawns, pawn, steps, enter);

				if (after !== null)
					splitSteps.push({type: 'split', cardId, pawnId: pawn.id, steps, enter});
			}
		}
	}
	return splitSteps;
}
