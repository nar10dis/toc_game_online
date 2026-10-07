import { Game, GameAction, Seat, Pawn, Card, CardId, BOARD_CELLS_COUNT } from "../../game.types";
import { getLegalActions } from "../legalMoves";
import { applyAction } from "../apply";
import { getSplitSteps } from "../split";
import { distanceToHome, startCell, getSeatOfStartCell, pawnsOf } from "../board";
import { mod } from "../utils";

const OUT_BONUS = 20;
const HOME_BONUS = 10;
const BLOCK_BONUS = 5;
const DANGER_MALUS = 15;
const SMALL_DANGER_MALUS = 5;
const MAX_CARD_STEPS = 13;
const COPIES_PER_VALUE = 4;
const NEXT_MOVE_WEIGHT = 0.5;
const SPLIT_STEPS = 7;

function progress(pawn: Pawn): number
{
	if (pawn.position.zone === 'spawn')
		return (0);
	if (pawn.position.zone === 'home')
		return (BOARD_CELLS_COUNT + OUT_BONUS + HOME_BONUS + pawn.position.cell);
	return (BOARD_CELLS_COUNT - distanceToHome(pawn.playerSeat, pawn.position.cell) + OUT_BONUS);
}

// Combien d'exemplaires de chaque valeur on n'a pas encore vus (index = valeur de la carte).
function unseenCards(game: Game, seat: Seat): number[]
{
	const unseen: number[] = new Array(MAX_CARD_STEPS + 1).fill(COPIES_PER_VALUE);

	for (const card of game.discardPile)
		unseen[card.value]--;
	for (const card of game.players[seat].hand)
		unseen[card.value]--;
	return (unseen);
}

function hasPawnInSpawn(pawns: Pawn[], seat: Seat): boolean
{
	return (pawnsOf(pawns, seat).some(pawn => pawn.position.zone === 'spawn'));
}

// Le malus si un adversaire est `distance` cases derriere notre pion.
// Plus il reste de cartes de cette valeur en jeu, plus le danger est grand.
function dangerMalus(distance: number, attackerHasSpawn: boolean, unseen: number[]): number
{
	if (distance < 1 || distance > MAX_CARD_STEPS)
		return (0);
	if (distance === 4 || distance === 5 || distance === 11)
		return (0);

	let malus = DANGER_MALUS;

	// l'as et le roi servent souvent a sortir un pion, sauf si l'adversaire n'a plus rien au spawn
	if ((distance === 1 || distance === 13) && attackerHasSpawn)
		malus = SMALL_DANGER_MALUS;
	return (malus * unseen[distance] / COPIES_PER_VALUE);
}

// Les bonus / malus d'un de nos pions sur le plateau, selon ce qui l'entoure.
function situation(pawns: Pawn[], pawn: Pawn, unseen: number[]): number
{
	if (pawn.position.zone !== 'board')
		return (0);

	// Sur sa case de sortie, personne ne peut le depasser donc personne ne peut le manger.
	if (pawn.position.cell === startCell(pawn.playerSeat))
		return (BLOCK_BONUS);

	let score = 0;

	// Sur la case de sortie d'un adversaire qui a encore des pions au spawn :
	// il nous tue en sortant avec un as ou un roi.
	const exitSeat = getSeatOfStartCell(pawn.position.cell);

	if (exitSeat !== null && hasPawnInSpawn(pawns, exitSeat))
		score -= DANGER_MALUS * (unseen[1] + unseen[13]) / (2 * COPIES_PER_VALUE);

	for (const other of pawns)
	{
		if (other.playerSeat === pawn.playerSeat || other.position.zone !== 'board')
			continue;
		// nombre de cases que l'adversaire doit avancer pour tomber sur nous
		score -= dangerMalus(mod(pawn.position.cell - other.position.cell, BOARD_CELLS_COUNT),
			hasPawnInSpawn(pawns, other.playerSeat), unseen);
	}
	return (score);
}

// Note tout le plateau du point de vue de `seat` : nos pions en +, les adversaires en -.
// Un adversaire tue retourne au spawn et perd toute sa progression : le bonus de kill vient tout seul.
function evaluate(pawns: Pawn[], seat: Seat, unseen: number[]): number
{
	let score = 0;

	for (const pawn of pawns)
	{
		if (pawn.playerSeat === seat)
			score += progress(pawn) + situation(pawns, pawn, unseen);
		else
			score -= progress(pawn);
	}
	return (score);
}

/* ************************************************************************** */
/*                                 LE 7                                       */
/* ************************************************************************** */
// Le 7 se joue en plusieurs morceaux (7, 6+1, 3+3+1...). Pour noter un morceau,
// on regarde le meilleur plateau qu'on peut avoir A LA FIN du 7, pas juste apres ce morceau.
//
// Probleme : on retombe tres souvent sur le meme plateau par des chemins differents
// (pion A +3 puis pion B +4 = pion B +4 puis pion A +3). Sans rien faire, on recalcule
// tout a chaque fois : hard devient ~25 fois plus lente.
// Solution : un cache. Chaque fois qu'on a calcule la fin du 7 pour un plateau,
// on la range dedans. Si on retombe sur ce plateau, on la relit au lieu de recalculer.

// cle du cache -> meilleur plateau a la fin du 7
type SplitCache = Map<string, Pawn[]>;

// Le plateau + les pas restants, ecrits en texte, pour servir de cle dans le cache.
// ex : "3|s,s,b12,h0,..." = 3 pas restants, pion 0 au spawn, pion 2 case 12, pion 3 maison 0...
function cacheKey(pawns: Pawn[], left: number): string
{
	let key = left + '|';

	for (const pawn of pawns)
	{
		if (pawn.position.zone === 'spawn')
			key += 's,';
		else
			key += pawn.position.zone[0] + pawn.position.cell + ',';
	}
	return (key);
}

// Finit le 7 de la meilleure facon : on essaie chaque morceau jouable,
// puis on recommence avec les pas qui restent. Renvoie le plateau a la fin du 7.
function finishSplit(pawns: Pawn[], seat: Seat, cardId: CardId, left: number, unseen: number[], cache: SplitCache): Pawn[]
{
	const key = cacheKey(pawns, left);
	const cached = cache.get(key);

	// deja calcule : on relit le resultat
	if (cached !== undefined)
		return (cached);

	const splitSteps: GameAction[] = getSplitSteps(pawns, seat, cardId, left);
	// plus aucun morceau jouable : le 7 est fini, on garde ce plateau
	let bestPawns: Pawn[] = pawns;
	let bestScore = -Infinity;

	for (const step of splitSteps)
	{
		// toujours vrai, mais TS a besoin de savoir que c'est un 'split' pour lire step.steps
		if (step.type !== 'split')
			continue;

		const after: Pawn[] = applyAction(pawns, seat, step).pawns;
		const end: Pawn[] = finishSplit(after, seat, cardId, left - step.steps, unseen, cache);
		const score = evaluate(end, seat, unseen);

		if (score > bestScore)
		{
			bestPawns = end;
			bestScore = score;
		}
	}
	cache.set(key, bestPawns);
	return (bestPawns);
}

/* ************************************************************************** */
/*                             CHOIX DU COUP                                  */
/* ************************************************************************** */

// Le plateau apres l'action. Pour un morceau de 7, c'est le plateau a la fin du 7.
function boardAfter(pawns: Pawn[], seat: Seat, action: GameAction, left: number, unseen: number[], cache: SplitCache): Pawn[]
{
	const after: Pawn[] = applyAction(pawns, seat, action).pawns;

	if (action.type !== 'split')
		return (after);
	return (finishSplit(after, seat, action.cardId, left - action.steps, unseen, cache));
}

// Ce que l'action fait gagner : le plateau apres moins le plateau avant.
function scoreAction(pawns: Pawn[], seat: Seat, action: GameAction, left: number, unseen: number[], cache: SplitCache): number
{
	// on ne defausse que si on n'a rien d'autre
	if (action.type === 'discard')
		return (-Infinity);

	const after: Pawn[] = boardAfter(pawns, seat, action, left, unseen, cache);

	return (evaluate(after, seat, unseen) - evaluate(pawns, seat, unseen));
}

// Le meilleur gain qu'on pourra faire au prochain tour avec les cartes qui restent.
// On ignore ce que les adversaires jouent entre-temps.
function bestNextGain(pawns: Pawn[], seat: Seat, hand: Card[], unseen: number[], cache: SplitCache): number
{
	let best = -Infinity;

	for (const action of getLegalActions(hand, pawns, seat, null))
		best = Math.max(best, scoreAction(pawns, seat, action, SPLIT_STEPS, unseen, cache));
	// plus de carte, ou que des defausses : rien a gagner
	if (best === -Infinity)
		return (0);
	return (best);
}

// Le coup maintenant + une partie du meilleur coup suivant : garde les cartes speciales
// (4, 5, valet, 7) pour le moment ou elles rapportent le plus.
function scoreWithNext(game: Game, seat: Seat, action: GameAction, unseen: number[], cache: SplitCache): number
{
	// pendant un 7 en cours, il reste moins de 7 pas
	const left: number = game.pendingSplit?.left ?? SPLIT_STEPS;
	const now: number = scoreAction(game.pawns, seat, action, left, unseen, cache);

	if (now === -Infinity)
		return (now);

	const after: Pawn[] = boardAfter(game.pawns, seat, action, left, unseen, cache);
	// la main sans la carte jouee. Pendant un 7 en cours, le 7 n'y est deja plus.
	const restHand: Card[] = game.players[seat].hand.filter(card => card.id !== action.cardId);

	return (now + NEXT_MOVE_WEIGHT * bestNextGain(after, seat, restHand, unseen, cache));
}

export function chooseHardAIAction(game: Game, seat: Seat): GameAction | null
{
	const legalMoves: GameAction[] = getLegalActions(game.players[seat].hand, game.pawns, seat, game.pendingSplit);
	const unseen: number[] = unseenCards(game, seat);
	// un cache neuf a chaque coup : le plateau change entre deux coups
	const cache: SplitCache = new Map();
	let best: GameAction | null = null;
	let bestScore = -Infinity;

	for (const action of legalMoves)
	{
		const score = scoreWithNext(game, seat, action, unseen, cache);

		// best === null : une defausse (-Infinity) est quand meme choisie si c'est le seul coup
		if (best === null || score > bestScore)
		{
			best = action;
			bestScore = score;
		}
	}
	return (best);
}
