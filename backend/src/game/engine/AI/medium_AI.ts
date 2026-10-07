import { Game, GameAction, Seat, Pawn, BOARD_CELLS_COUNT } from "../../game.types";
import { getLegalActions } from "../legalMoves";
import { applyAction } from "../apply";
import { distanceToHome, startCell } from "../board";
import { mod } from "../utils";

const OUT_BONUS = 20;
const HOME_BONUS = 10;
const BLOCK_BONUS = 5;
const DANGER_MALUS = 15;
//just pr l'as et le roi
const SMALL_DANGER_MALUS = 5;
const MAX_CARD_STEPS = 13;

//le score d'un pion
function progress(pawn: Pawn): number
{
	if (pawn.position.zone === 'spawn')
		return (0);
	if (pawn.position.zone === 'home')
		return (BOARD_CELLS_COUNT + OUT_BONUS + HOME_BONUS + pawn.position.cell);
	return (BOARD_CELLS_COUNT - distanceToHome(pawn.playerSeat, pawn.position.cell) + OUT_BONUS);
}

function dangerMalus(distance: number): number
{
	if (distance < 1 || distance > MAX_CARD_STEPS)
		return (0);
	if (distance === 4 || distance === 5 || distance === 11)
		return (0);
	if (distance === 1 || distance === 13)
		return (SMALL_DANGER_MALUS);
	return (DANGER_MALUS);
}

// Les bonus / malus d'un de nos pions sur le plateau, selon ce qui l'entoure.
function situation(pawns: Pawn[], pawn: Pawn): number
{
	if (pawn.position.zone !== 'board')
		return (0);

	// Sur sa case de sortie, personne ne peut le depasser donc personne ne peut le manger.
	if (pawn.position.cell === startCell(pawn.playerSeat))
		return (BLOCK_BONUS);

	let score = 0;

	for (const other of pawns)
	{
		if (other.playerSeat === pawn.playerSeat || other.position.zone !== 'board')
			continue;
		// nombre de cases que l'adversaire doit avancer pour tomber sur nous
		score -= dangerMalus(mod(pawn.position.cell - other.position.cell, BOARD_CELLS_COUNT));
	}
	return (score);
}

// Note tout le plateau du point de vue de `seat` : nos pions en +, les adversaires en -.
// Un adversaire tue retourne au spawn et perd toute sa progression : le bonus de kill vient tout seul.
function evaluate(pawns: Pawn[], seat: Seat): number
{
	let score = 0;

	for (const pawn of pawns)
	{
		if (pawn.playerSeat === seat)
			score += progress(pawn) + situation(pawns, pawn);
		else
			score -= progress(pawn);
	}
	return (score);
}

// Ce que l'action fait gagner : le plateau apres moins le plateau avant.
function scoreAction(pawns: Pawn[], seat: Seat, action: GameAction): number
{
	// on ne defausse que si on n'a rien d'autre
	if (action.type === 'discard')
		return (-Infinity);

	const after = applyAction(pawns, seat, action);

	return (evaluate(after.pawns, seat) - evaluate(pawns, seat));
}

export function chooseMediumAIAction(game: Game, seat: Seat): GameAction | null
{
	const legalMoves: GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);
	let best: GameAction | null = null;
	let bestScore = -Infinity;

	for (const action of legalMoves)
	{
		const score = scoreAction(game.pawns, seat, action);

		// best === null : une defausse (-Infinity) est quand meme choisie si c'est le seul coup
		if (best === null || score > bestScore)
		{
			best = action;
			bestScore = score;
		}
	}
	return (best);
}
