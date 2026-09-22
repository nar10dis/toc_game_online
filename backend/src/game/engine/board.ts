import { Seat, Pawn, BOARD_CELLS_COUNT, HOME_CELLS_COUNT } from '../game.types';
import { mod } from './utils';

export function pawnsOf(pawns: Pawn[], seat: Seat): Pawn[]
{
	//filter = on cree une copie du tableau avec les elements qui valident la callback.
	return pawns.filter(pawn => pawn.playerSeat === seat);
}

// Nombre de cases entre deux sorties consecutives.
const CELLS_PER_SEAT = BOARD_CELLS_COUNT / 4;

export function startCell(seat: Seat): number
{
	return (seat * CELLS_PER_SEAT);
}

// Le siege dont cette case est la sortie, null si ce n'est pas une case de sortie.
export function getSeatOfStartCell(cell: number): Seat | null
{
	const boardCell = mod(cell, BOARD_CELLS_COUNT);

	if (boardCell % CELLS_PER_SEAT !== 0)
		return (null);

	return ((boardCell / CELLS_PER_SEAT) as Seat);
}

export function distanceToHome(seat: Seat, cell: number): number
{
	const distance: number = mod(startCell(seat) - cell, BOARD_CELLS_COUNT);

	return (distance === 0 ? BOARD_CELLS_COUNT : distance);
}

export function pawnAt(pawns: Pawn[], cell: number): Pawn | null
{
	const found = pawns.find(
		pawn => pawn.position.zone === 'board' && pawn.position.cell === cell,
	);

	return (found ?? null);
}

// Le pion pose sur cette case de la maison du joueur, null si elle est libre.
export function pawnAtHome(pawns: Pawn[], seat: Seat, cell: number): Pawn | null
{
	const found = pawnsOf(pawns, seat).find(
		pawn => pawn.position.zone === 'home' && pawn.position.cell === cell,
	);

	return (found ?? null);
}

//tab des cases traversees avec deplacement
export function pathCells(from: number, steps: number): number[]
{
	const cells: number[] = [];
	const direction: number = steps < 0 ? -1 : 1;

	for (let i = 1; i <= Math.abs(steps); i++)
	{
		cells.push(mod(from + i * direction, BOARD_CELLS_COUNT));
	}
	return (cells);
}

export function homeLastFreeCell(pawns: Pawn[], seat: Seat): number
{
	for (let cell = 0; cell < HOME_CELLS_COUNT; cell++)
	{
		if (pawnAtHome(pawns, seat, cell) !== null)
			return (cell - 1);
	}
	return (HOME_CELLS_COUNT - 1);
}

export function getStartHome(seat: Seat): number {
	let startingCell = startCell(seat);

	if (startingCell === 0)
		return BOARD_CELLS_COUNT - 3;
	return startingCell - 3;
}

export function homeCellIndex(seat: Seat, from: number, steps: number): number {
	const toEntry = mod(getStartHome(seat) - from, BOARD_CELLS_COUNT);

	return (steps - toEntry - 1);
}
