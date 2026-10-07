import { Card, CardId, Pawn, Seat, GameAction, Game } from "../game.types"
import { pawnsOf } from "./board";
import * as Rules from "./rules"
import { realValueOf } from "./deck"
import { getSplitSteps } from "./split"

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

export function getLegalActions(hand : Card[], pawns: Pawn[], seat: Seat, pendingSplit: Game['pendingSplit']) : GameAction[] {
	const myPawns : Pawn[] = pawnsOf(pawns, seat);
	const legalMoves : GameAction[] = [];

	//un 7 est en cours : on ne peut que le continuer
	if (pendingSplit !== null)
		return getSplitSteps(pawns, seat, pendingSplit.cardId, pendingSplit.left);

	for (const card of hand)
	{
		//le 7 se joue seulement en morceaux. On le defausse s'il est injouable.
		if (card.value === 7)
		{
			const splitSteps : GameAction[] = getSplitSteps(pawns, seat, card.id, 7);

			legalMoves.push(...splitSteps);
			if (splitSteps.length === 0)
				legalMoves.push({type: 'discard', cardId: card.id});
			continue;
		}
		//le 5 fait avancer seulement un pion adverse, sur le plateau. On le defausse s'il est injouable.
		if (card.value === 5)
		{
			const fiveMoves : GameAction[] = [];

			for (const pawn of pawns)
			{
				if (pawn.playerSeat !== seat && Rules.canMove(pawns, 5, pawn))
					fiveMoves.push({type: 'move', cardId: card.id, pawnId: pawn.id});
			}
			legalMoves.push(...fiveMoves);
			if (fiveMoves.length === 0)
				legalMoves.push({type: 'discard', cardId: card.id});
			continue;
		}
		//le valet echange deux pions du plateau, a nous ou pas. Il n'avance jamais. On le defausse s'il est injouable.
		if (card.value === 11)
		{
			const swaps : GameAction[] = [];

			//j commence apres i : chaque paire une seule fois, pas de doublon
			for (let i = 0; i < pawns.length; i++)
			{
				for (let j = i + 1; j < pawns.length; j++)
				{
					if (Rules.canSwap(pawns, card, pawns[i], pawns[j]))
						swaps.push({type: 'swap', cardId: card.id, pawnIdA: pawns[i].id, pawnIdB: pawns[j].id});
				}
			}
			legalMoves.push(...swaps);
			if (swaps.length === 0)
				legalMoves.push({type: 'discard', cardId: card.id});
			continue;
		}
		for (const pawn of myPawns)
		{
			if (Rules.canMove(pawns, realValueOf(card), pawn) || Rules.canMoveInHome(pawns, realValueOf(card), pawn))
				legalMoves.push({type: 'move', cardId: card.id, pawnId: pawn.id});
			if (Rules.canGoHome(pawns, realValueOf(card), pawn))
				legalMoves.push({type: 'enter', cardId: card.id, pawnId:pawn.id});
			if (Rules.canExit(pawns, card, pawn))
				legalMoves.push({type: 'exit', cardId: card.id, pawnId: pawn.id});
		}
		if (Rules.canDiscard(pawns, card, seat))
			legalMoves.push({type: 'discard', cardId :card.id});
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
		case 'split':
			return a.pawnId === (b as typeof a).pawnId
				&& a.steps === (b as typeof a).steps
				&& a.enter === (b as typeof a).enter;
		case 'discard':
			return true;
		default:
			return false;
	}
}

//action quon recoit du front : on la compare a la liste des legalAciton!
export function isLegal(hand: Card[], pawns: Pawn[], seat: Seat, pendingSplit: Game['pendingSplit'], action: GameAction) : boolean {
	const legalMoves : GameAction[] = getLegalActions(hand, pawns, seat, pendingSplit);

	for (const legal of legalMoves)
	{
		if (sameAction(legal, action))
			return true;
	}
	return false;
}
