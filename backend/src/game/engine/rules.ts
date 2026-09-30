import { Card, Pawn, Seat, HOME_CELLS_COUNT, BOARD_CELLS_COUNT} from "../game.types"
import { pawnAt, pathCells, getSeatOfStartCell, pawnsOf,
	homeLastFreeCell, getStartHome, pawnAtHome, homeCellIndex} from "./board"
import { mod } from "./utils"
import { realValueOf } from "./deck"

export function canExit(pawns: Pawn[], card : Card, pawn: Pawn) : boolean {

	if (pawn.position.zone !== 'spawn')
			return false;
	if (card.value !== 13 && card.value !== 1)
		return false;

	//On sort meme si la case de sortie est occupee : le pion dessus se fait
	//tuer, y compris si c'est un des notres.
	return true;
}

export function canMove(pawns: Pawn[], steps: number, pawn: Pawn) : boolean {

	if (pawn.position.zone !== 'board')
		return false;

	const allCells : number[] = pathCells(pawn.position.cell, steps);

	//si ya un spawn sur son chemin
	// si le pion a le meme seat que le spawn -> false
	for (const cell of allCells)
	{
		let spawnSeat: Seat | null = getSeatOfStartCell(cell);

		if (pawnAt(pawns, cell)?.playerSeat === spawnSeat)
			return false;
	}
	return true;
}

export function canGoHome(pawns : Pawn[], steps: number, pawn: Pawn) : boolean {

	const lastCell = homeLastFreeCell(pawns, pawn.playerSeat);
	const startHome = getStartHome(pawn.playerSeat);

	if (lastCell < 0)
			return false;
	if (pawn.position.zone !== 'board')
		return false;
	if (steps <= 0)
		return false;
	const toEntry = mod(startHome - pawn.position.cell, BOARD_CELLS_COUNT);
	const distanceMax = toEntry + 1 + lastCell;

	const target = homeCellIndex(pawn.playerSeat, pawn.position.cell, steps);
	if (target < 0 || target > lastCell)
		return false;
	return true;
}

export function canMoveInHome(pawns: Pawn[], steps: number, pawn: Pawn): boolean {

	if (pawn.position.zone !== 'home')
			return false;
	if (steps <= 0)
			return false;

	const target = pawn.position.cell + steps;

	if (target >= HOME_CELLS_COUNT)
			return false;

	for (let cell = pawn.position.cell + 1; cell <= target; cell++)
	{
			if (pawnAtHome(pawns, pawn.playerSeat, cell) !== null)
					return false;
	}
	return true;
}

export function canSwap(pawns: Pawn[], card: Card, pawnA: Pawn, pawnB: Pawn) : boolean {

	if (card.value !== 11)
		return false;
	if (pawnA === pawnB)
		return false;
	if (pawnA.position.zone !== 'board' || pawnB.position.zone !== 'board')
		return false;
	return true;
}

//permise si cette carte ne permet aucun coup.
export function canDiscard(pawns: Pawn[], card: Card, seat: Seat) : boolean {
	for (const pawn of pawnsOf(pawns, seat))
	{
			if (canExit(pawns, card, pawn))
				return false;
			if (canMove(pawns, realValueOf(card), pawn))
				return false;
			if (canGoHome(pawns, realValueOf(card), pawn))
				return false;
			if (canMoveInHome(pawns, realValueOf(card), pawn))
				return false;
			for (const other of pawns)
			{
				if (canSwap(pawns, card, pawn, other))
					return false;
			}
	}
	return true;
}
