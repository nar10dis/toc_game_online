import { Card, Pawn, Seat, HOME_CELLS_COUNT, BOARD_CELLS_COUNT} from "../game.types"
import { pawnAt, pawnsOf, startCell, pathCells, getSeatOfStartCell, homeLastFreeCell} from "./board"

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

	if (pawn.position.zone === 'spawn')
		return false;

	const allCells : number[] = pathCells(pawn.position.cell, card.value);

	//si ya un spawn sur son chemin
	// si le pion a le meme seat que le spawn -> false
	for (let i = pawn.position.cell; i < allCells.length; i++)
	{
		let spawnSeat: Seat | null = getSeatOfStartCell(i);

		if (pawnAt(pawns, i)?.playerSeat === spawnSeat)
			return false;
	}
	return true;
}

export function canGoHome(pawns : Pawn[], card: Card, pawn: Pawn) : boolean {
	const remainingCells = homeLastFreeCell(pawns, pawn.playerSeat, )
}

export function canSwap(pawns: Pawn[], card: Card, pawnA: Pawn, pawnB: Pawn) : boolean {

	if (card.value !== 11)
		return false;
	if (pawnA.position.zone === 'spawn' || pawnB.position.zone === 'spawn')
			return false;
	return true;
}

// TO DO LATER
// export function canSplit()
