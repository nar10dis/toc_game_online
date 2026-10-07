import { Pawn, Seat, GameAction, PawnPosition, CardValue, BOARD_CELLS_COUNT, Game } from "../game.types"
import { getStartHome, homeCellIndex, pawnAt, startCell} from "./board"
import { cardFromId, realValueOf } from "./deck";
import { findPawn } from "./legalMoves";
import { mod } from "./utils"
import { simulateSplitStep } from "./split"

export type ActionResult = {
	pawns: Pawn[]; //nouveau tableau
	captured: Pawn[] // pions dead pr le front.
}

export function setPawnPosition(pawns: Pawn[], pawnId: number, position: PawnPosition) : Pawn[] {
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

export function captureAt(pawns: Pawn[], cell: number) : ActionResult {
	const victim = pawnAt(pawns, cell);

	if (victim === null)
		return {pawns, captured: []};
	return { pawns: setPawnPosition(pawns, victim.id, {zone: 'spawn'}), captured: [victim]};
}


//LACTION EST DEJA LEGALE.
//touche seulement aux pions, pas aux cartes
export function applyAction(pawns: Pawn[], seat: Seat, action: GameAction) : ActionResult{

	switch(action.type)
	{
		case 'move': {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);
			const steps : number = realValueOf(cardFromId(action.cardId));

			//cannot be true mais TS oblige
			if (pawn === null || pawn.position.zone === 'spawn')
				return ({pawns, captured: []})
			if (pawn.position.zone === 'home')
			{
					const target = pawn.position.cell + steps;

					return ({
						pawns: setPawnPosition(pawns, pawn.id, { zone: 'home', cell: target }),
						captured: [],
					});
			}

			const target = mod(pawn.position.cell + steps, BOARD_CELLS_COUNT);
			const hit = captureAt(pawns, target);

			return ({
				pawns: setPawnPosition(hit.pawns, pawn.id, { zone: 'board', cell: target }),
				captured: hit.captured,
			});
		}
		case 'enter' : {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);

			if (pawn === null || pawn.position.zone !== 'board')
				return ({pawns, captured: []});

 			const target = homeCellIndex(seat, pawn.position.cell, realValueOf(cardFromId(action.cardId)));
			return ({
				pawns: setPawnPosition(pawns, pawn.id, {zone: 'home', cell: target}),
				captured: []
			});
		}
		case 'exit' : {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);

			if (pawn === null || pawn.position.zone !== 'spawn')
				return ({pawns, captured: []});

			const target = startCell(seat);
			const hit = captureAt(pawns, target);

			return ({
				pawns: setPawnPosition(hit.pawns, pawn.id, { zone: 'board', cell: target }),
				captured: hit.captured,
			});
		}
		case 'swap' : {
			const pawnA : Pawn | null = findPawn(pawns, action.pawnIdA);
			const pawnB : Pawn | null = findPawn(pawns, action.pawnIdB);

			if ((pawnA === null || pawnA.position.zone !== 'board')
					|| (pawnB === null || pawnB.position.zone !== 'board'))
				return ({pawns, captured: []});

			return ({
				pawns : pawns.map(p => {
								if (p.id === pawnA.id)
									return {...p, position: pawnB.position};
								if (p.id === pawnB.id)
									return {...p, position: pawnA.position};
								return p;
				}),
				captured: []
			});
		}
		case 'split' : {
			const pawn : Pawn | null = findPawn(pawns, action.pawnId);

			if (pawn === null)
				return ({pawns, captured: []});
<<<<<<< HEAD

			const cardValue : CardValue = cardValueOf(action.cardId);
			const startOfHome = startCell(seat);
			const target = pawn.position.cell + cardValue;

			// if (mod(pawn.position.cell + cardValue, BOARD_CELLS_COUNT) )
			}

=======
			return simulateSplitStep(pawns, pawn, action.steps, action.enter) ?? {pawns, captured: []};
		}
>>>>>>> dev
	}
	return {pawns, captured: []};
}
