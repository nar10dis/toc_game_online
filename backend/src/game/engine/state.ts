import { Game, Pawn, Player, Seat, Card, CardId, HOME_CELLS_COUNT, GameAction} from "../game.types"
import { ActionResult, applyAction } from "./apply";
import { pawnsOf } from "./board";
import { createDeck, dealCards, isRoundOver, playCard, shuffleDeck } from "./deck";
import { isLegal } from "./legalMoves";
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
export function startGame(game: Game): Game {

	return {...game,
		currentSeat: 0,
		winner: null,
		phase: 'playing',
		drawPile: shuffleDeck(createDeck()),
		discardPile: [],
		pawns: createPawns(game.players)
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

export function playTurn(game : Game, seat: Seat, action : GameAction): { game: Game, result: ActionResult } | null {

	let currentPlayer : Player = {...game.players[seat]};
	let newCardState : {hand: Card[], discardPile: Card[]} | null;
	let result : ActionResult;
	let winner : Seat | null;
	//check si laction est leglae
	if (!isLegal(currentPlayer.hand, game.pawns, seat, action))
		return null;
	//lapplique
	result = applyAction(game.pawns, seat, action);
	//la joue
	newCardState = playCard(currentPlayer.hand, game.discardPile, action.cardId);
	if (!newCardState)
		return null; //la carte nexiste pas dans la main du joueur
	currentPlayer = {...currentPlayer, hand: newCardState.hand};
	game = {...game,
			players: game.players.map((p, i) => i === seat ? currentPlayer : p),
			discardPile: newCardState.discardPile,
			pawns: result.pawns};
	winner = checkWinner(game);
	if (winner)
		return {game : {...game, phase: 'finished', winner}, result};
	game = nextSeat(game);
	if (isRoundOver(game.players))
		game = startRound(game);

	return {game, result};
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

//ce quon recoit du client !
export function playAction(gameId: number, userId: number, action: GameAction) : Game {

	//recup la partie dans la map;
	game : Game
	// traduire useId en seat

	//check si c bien son tour

	// PLAY TURN la current action

	// Play the IA turn (yaura pas dautres requetes jusquau nouveau playAction)

	//return game pour broadcast letat aux joueurs.
}
