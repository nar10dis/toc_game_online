import { Card, Pawn, Seat, HOME_CELLS_COUNT, BOARD_CELLS_COUNT} from "../game.types"
import { pawnAt, pawnsOf, startCell, pathCells, getSeatOfStartCell,
	homeLastFreeCell, getStartHome, pawnAtHome} from "./board"
import { mod } from "./utils"
export function canExit(pawns: Pawn[], card : Card, pawn: Pawn) : boolean {

	if (pawn.position.zone !== 'spawn')
			return false;
	if (card.value !== 13 && card.value !== 1)
		return false;

	const myStartCell = startCell(pawn.playerSeat);
	const blocker = pawnAt(pawns, myStartCell);

	if (blocker !== null)
	{
		if (blocker.playerSeat === pawn.playerSeat)
			return false;
	}
	return true;
}

export function canMove(pawns: Pawn[], card: Card, pawn: Pawn) : boolean {

	if (pawn.position.zone !== 'board')
		return false;

	const allCells : number[] = pathCells(pawn.position.cell, card.value);

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

export function canGoHome(pawns : Pawn[], card: Card, pawn: Pawn) : boolean {

	const lastCell = homeLastFreeCell(pawns, pawn.playerSeat);
	const startHome = getStartHome(pawn.playerSeat);

	if (lastCell < 0)
			return false;
	if (pawn.position.zone !== 'board')
		return false;
	if (card.value <= 0)
		return false;
	const toEntry = mod(startHome - pawn.position.cell, BOARD_CELLS_COUNT);
	const distanceMax = toEntry + 1 + lastCell;

	if (card.value < toEntry + 1|| card.value > distanceMax)
		return false;
	return true;
}

export function canMoveInHome(pawns: Pawn[], card: Card, pawn: Pawn): boolean {

	if (pawn.position.zone !== 'home')
			return false;
	if (card.value <= 0)
			return false;

	const target = pawn.position.cell + card.value;

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

// TO DO LATER
// export function canSplit()
