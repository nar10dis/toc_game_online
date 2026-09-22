import { Card, CardId, Pawn, Seat, GameAction} from "../game.types"
import { pawnsOf } from "./board";
import * as Rules from "./rules"

export function findPawn(pawns: Pawn[], pawnId : number) : Pawn | null {
	for (const pawn of pawns)
	{
		if (pawn.id === pawnId)
			return pawn;
	}
	return null;
}

export function findCard(hand: Card[], cardId: CardId) : Card | null {
	for (const card of hand)
	{
		if (card.id === cardId)
			return card;
	}
	return null;
}

export function getLegalActions(hand : Card[], pawns: Pawn[], seat: Seat) : GameAction[] {
	const myPawns : Pawn[] = pawnsOf(pawns, seat);
	const legalMoves : GameAction[] = [];

	for (const card of hand)
	{
		for (const pawn of myPawns)
		{
			if (Rules.canMove(pawns, card, pawn) || Rules.canMoveInHome(pawns, card, pawn))
				legalMoves.push({type: 'move', cardId: card.id, pawnId: pawn.id});
			if (Rules.canGoHome(pawns, card, pawn))
				legalMoves.push({type: 'enter', cardId: card.id, pawnId:pawn.id});
			if (Rules.canExit(pawns, card, pawn))
				legalMoves.push({type: 'exit', cardId: card.id, pawnId: pawn.id});
			for (const other of pawns)
			{
				if (Rules.canSwap(pawns, card, pawn, other))
				{
					//pour eviter les doublons !
					if (other.playerSeat === seat && other.id < pawn.id)
						continue;
					legalMoves.push({type: 'swap', cardId: card.id, pawnIdA: pawn.id, pawnIdB: other.id});
				}
			}
			if (Rules.canDiscard(pawns, card, seat))
				legalMoves.push({type: 'discard', cardId :card.id});
		}
	}
	return legalMoves;
}

// Deux actions designent-elles le meme coup ? On compare des ids, pas des objets.
function sameAction(a: GameAction, b: GameAction) : boolean {
	if (a.type !== b.type || a.cardId !== b.cardId)
		return false;

	switch (a.type)
	{
		case 'move':
		case 'enter':
		case 'exit':
			return a.pawnId === (b as typeof a).pawnId;
		case 'swap':
			return a.pawnIdA === (b as typeof a).pawnIdA
				&& a.pawnIdB === (b as typeof a).pawnIdB;
		case 'discard':
			return true;
		default:
			return false;
	}
}

//action quon recoit du front : on la compare a la liste des legalAciton!
export function isLegal(hand: Card[], pawns: Pawn[], seat: Seat, action: GameAction) : boolean {
	const legalMoves : GameAction[] = getLegalActions(hand, pawns, seat);

	for (const legal of legalMoves)
	{
		if (sameAction(legal, action))
			return true;
	}
	return false;
}
