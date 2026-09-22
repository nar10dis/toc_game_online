import { Pawn, Seat, GameAction, PawnPosition, CardValue, BOARD_CELLS_COUNT, Game } from "../game.types"
import { homeCellIndex, pawnAt, startCell} from "./board"
import { cardValueOf } from "./deck";
import { findPawn } from "./legalMoves";
import { mod } from "./utils"

export type ActionResult = {
	pawns: Pawn[]; //nouveau tableau
	captured: Pawn[] // pions dead pr le front.
}

function withPosition(pawns: Pawn[], pawnId: number, position: PawnPosition) : Pawn[] {
	const result : Pawn[] = [];

	//POSSIBLE DE FAIRE AVEC MAP + TERMAIRE EN CHAD.
	for (const pawn of pawns)
	{
		//si c le bon on le push a la nouvelle position
		if (pawn.id === pawnId)
			result.push({id : pawn.id, playerSeat: pawn.playerSeat, position: position});
		else
			result.push(pawn);
	}
	return result;
}

function captureAt(pawns: Pawn[], cell: number) : ActionResult {
	const victim = pawnAt(pawns, cell);

	if (victim === null)
		return {pawns, captured: []};
	return { pawns: withPosition(pawns, victim.id, {zone: 'spawn'}), captured: [victim]};
}


//LACTION EST DEJA LEGALE.
//touche seulement aux pions, pas aux cartes
export function applyAction(pawns: Pawn[], seat: Seat, action: GameAction) : ActionResult{

	switch(action.type)
	{
		case 'move': {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);
			const steps : CardValue = cardValueOf(action.cardId);

			//cannot be true mais TS oblige
			if (pawn === null || pawn.position.zone === 'spawn')
				return ({pawns, captured: []})
			if (pawn.position.zone === 'home')
			{
					const target = pawn.position.cell + steps;

					return ({
						pawns: withPosition(pawns, pawn.id, { zone: 'home', cell: target }),
						captured: [],
					});
			}

			const target = mod(pawn.position.cell + steps, BOARD_CELLS_COUNT);
			const hit = captureAt(pawns, target);

			return ({
				pawns: withPosition(hit.pawns, pawn.id, { zone: 'board', cell: target }),
				captured: hit.captured,
			});
		}
		case 'exit' : {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);

			if (pawn === null || pawn.position.zone !== 'spawn')
				return ({pawns, captured: []});

			const target = startCell(seat);
			const hit = captureAt(pawns, target);

			return ({
				pawns: withPosition(hit.pawns, pawn.id, { zone: 'board', cell: target }),
				captured: hit.captured,
			});
		}
	}
	return {pawns, captured: []};
}
