import { Game, Pawn, Player, Seat, HOME_CELLS_COUNT} from "../game.types"
import { createDeck, dealCards, shuffleDeck } from "./deck";
//createGame, startRound, nextTurn, checkWinner

export const PAWN_BY_PLAYER = 4;

//waiting / create
// export function initGame(id: number, inviteCode: string, host: Player): Game
// {
// }

// //waiting  / join
// export function addPlayer(game: Game, player: Player): Game | null {

// 	if (game.players.length === 4)
// 		return null;
// }

function createPawns(players: Player[]) : Pawn[] {

	const pawns: Pawn[] = [];

	for (const player of players)
	{
		for (let i = 0 ; i < PAWN_BY_PLAYER; i++)
		{
			//id = 0 1 2 3 puis 4 5 6 7 etc
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

	const newGame = {...game};

	newGame.currentSeat = 0;
	newGame.drawPile = shuffleDeck(createDeck());
	newGame.discardPile = [];
	newGame.pawns = createPawns(newGame.players);
	newGame.winner = null;
	return {...newGame};
}

export function startRound(game: Game): Game {
	const cardsDealt = dealCards(game.drawPile, game.discardPile);
	let i = 0;

	for (const player of game.players)
	{
		player.hand = cardsDealt.hands[i];
		i++;
	}
	return {...game, discardPile: cardsDealt.discardPile, drawPile: cardsDealt.drawPile};

}
