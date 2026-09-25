import { Game, GameView, Seat } from "../game.types";

// La partie vue depuis un siege : on cache la pioche et la main des autres.
export function viewFor(game: Game, seat: Seat): GameView {
	const { drawPile, players, ...rest } = game;

	return {
		...rest,
		mySeat: seat,
		myHand: players[seat].hand,
		players: players.map(({ hand, ...player }) => ({ ...player, handCount: hand.length })),
		drawPileCount: drawPile.length,
	};
}
