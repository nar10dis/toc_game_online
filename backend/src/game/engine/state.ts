import { Game, Pawn, Player, Seat, Card, CardId, HOME_CELLS_COUNT, GameAction, GameEvent} from "../game.types"
import { ActionResult, applyAction } from "./apply";
import { pawnsOf } from "./board";
import { createDeck, dealCards, isRoundOver, playCard, shuffleDeck } from "./deck";
import { isLegal } from "./legalMoves";
import { getSplitSteps } from "./split";
import { mod } from "./utils";

//createGame, startRound, nextTurn, checkWinner

export const PAWN_BY_PLAYER = 4;

// waiting / create
export function initGame(id: number, inviteCode: string): Game
{
	const newGame : Game = {
				id,
				inviteCode,
				phase: 'waiting',
				players: [],
				pawns: [],
				drawPile: [],
				discardPile: [],
				currentSeat: 0,
				winner: null,
				pendingSplit: null,
				fastBots: false,
		}
	return newGame;
}

// //waiting  / join
export function addPlayer(game: Game, userId: number, pseudo: string): Game {
	const newPlayer : Player = {
		hand: [],
		isConnected: true,
		pseudo,
		seat: game.players.length as Seat,
		userId
	};

	return { ...game, players: [...game.players, newPlayer]};
}

function createPawns(players: Player[]) : Pawn[] {

	const pawns: Pawn[] = [];

	for (const player of players)
	{
		for (let i = 0 ; i < PAWN_BY_PLAYER; i++)
		{
			pawns.push({id: player.seat * PAWN_BY_PLAYER + i,
						playerSeat: player.seat,
						position: {zone: 'spawn'}
			});
		}
	}
	return pawns;
}

//playing // start
export function initStartingGame(game: Game): Game {

	let nextSeat = game.players.length as Seat;
	let IAPlayers : Player[] = [];

	while (nextSeat < 4) {
		IAPlayers.push({
			userId: null,
			pseudo: `IA ${nextSeat + 1}`,
			seat: nextSeat,
			hand: [],
			isConnected: true,
		});
		nextSeat++;
	}
	// les humains deja la + les IA : game.players n'est pas modifie
	const allPlayers : Player[] = [...game.players, ...IAPlayers];

	return {...game,
		currentSeat: 0,
		winner: null,
		pendingSplit: null,
		phase: 'playing',
		players: allPlayers,
		drawPile: shuffleDeck(createDeck()),
		discardPile: [],
		pawns: createPawns(allPlayers)
	};
}

export function startRound(game: Game): Game {
	const dealt = dealCards(game.drawPile, game.discardPile);
	const newPlayers: Player[] = [];

	for (let i = 0; i < game.players.length; i++)
	{
		newPlayers.push({...game.players[i], hand: dealt.hands[i]})
	}
	return {...game,
			players: newPlayers,
			drawPile: dealt.drawPile,
			discardPile: dealt.discardPile
	};

}

export function playTurn(game : Game, seat: Seat, action : GameAction): { game: Game, event: GameEvent } | null {

	let currentPlayer : Player = {...game.players[seat]};
	let newCardState : {hand: Card[], discardPile: Card[]} | null;
	let result : ActionResult;
	let winner : Seat | null;
	let event : GameEvent;
	//check si laction est leglae
	if (!isLegal(currentPlayer.hand, game.pawns, seat, game.pendingSplit, action))
		return null;
	//lapplique
	result = applyAction(game.pawns, seat, action);
	//la joue. Pendant un 7, la carte est deja posee depuis le premier morceau.
	if (game.pendingSplit === null)
	{
		newCardState = playCard(currentPlayer.hand, game.discardPile, action.cardId);
		if (!newCardState)
			return null; //la carte nexiste pas dans la main du joueur
		currentPlayer = {...currentPlayer, hand: newCardState.hand};
		game = {...game,
				players: game.players.map((p, i) => i === seat ? currentPlayer : p),
				discardPile: newCardState.discardPile};
	}
	game = {...game, pawns: result.pawns};

	//ce qui vient de se passer, pour que le front puisse l'animer
	event = { seat, action, captured: result.captured, newRound: false };
	winner = checkWinner(game);
	if (winner !== null)
		return {game : {...game, phase: 'finished', winner}, event};
	//le 7 : tant qu'il reste des pas jouables, le meme joueur rejoue.
	//Si plus rien n'est jouable, les pas restants sont perdus.
	if (action.type === 'split')
	{
		const left = (game.pendingSplit?.left ?? 7) - action.steps;
		const canGoOn = left > 0 && getSplitSteps(game.pawns, seat, action.cardId, left).length > 0;

		if (canGoOn)
			return {game: {...game, pendingSplit: {cardId: action.cardId, left}}, event};
		game = {...game, pendingSplit: null};
	}
	game = nextSeat(game);
	if (isRoundOver(game.players))
	{
		game = startRound(game);
		event.newRound = true;
	}

	return {game, event};
}

export function checkWinner(game: Game) : Seat | null {

	for (let i = 0; i < game.players.length; i++)
	{
		let pawnTeam : Pawn[] = pawnsOf(game.pawns, i as Seat);
		//every return true quand la condition marche sur tous les elements
		if (pawnTeam.every(p => p.position.zone === 'home'))
			return pawnTeam[0].playerSeat;
	}
	return null;
}

export function nextSeat(game: Game) : Game{
	return {...game,
			currentSeat: mod(game.currentSeat + 1, 4) as Seat
	};
}
