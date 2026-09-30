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

// Peut-on encore jouer les `left` pas qui restent ? (recursif)
// On essaie chaque pion, chaque nombre de pas, en move puis en enter,
// et on recommence sur le plateau d'apres avec ce qui reste.
export function canFinishSplit(pawns: Pawn[], seat: Seat, left: number) : boolean {

	if (left === 0)
		return true;

	for (const pawn of pawnsOf(pawns, seat))
	{
		for (let steps = 1; steps <= left; steps++)
		{
			for (const enter of [false, true])
			{
				const after = simulateSplitStep(pawns, pawn, steps, enter);

				if (after !== null && canFinishSplit(after.pawns, seat, left - steps))
					return true;
			}
		}
	}
	return false;
}

// Les morceaux jouables maintenant. On garde seulement ceux qui
// permettent de finir le 7 : le joueur ne peut jamais se bloquer.
export function getSplitSteps(pawns: Pawn[], seat: Seat, cardId: CardId, left: number) : GameAction[] {
	const splitSteps : GameAction[] = [];

	for (const pawn of pawnsOf(pawns, seat))
	{
		for (let steps = 1; steps <= left; steps++)
		{
			for (const enter of [false, true])
			{
				const after = simulateSplitStep(pawns, pawn, steps, enter);

				if (after !== null && canFinishSplit(after.pawns, seat, left - steps))
					splitSteps.push({type: 'split', cardId, pawnId: pawn.id, steps, enter});
			}
		}
	}
	return splitSteps;
}
