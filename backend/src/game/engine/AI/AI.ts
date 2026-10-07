import { Game, GameAction, Seat } from "../../game.types";
import { chooseEasyAIAction } from "./easy_AI";
import { chooseMediumAIAction } from "./medium_AI";
import { chooseHardAIAction } from "./hard_AI";

// Le coup du bot assis a `seat`, avec la difficulte choisie pour ce siege.
export function chooseAIAction(game: Game, seat: Seat): GameAction | null
{
	switch (game.aiLevels[seat])
	{
		case 'easy':
			return (chooseEasyAIAction(game, seat));
		case 'hard':
			return (chooseHardAIAction(game, seat));
		default:
			return (chooseMediumAIAction(game, seat));
	}
}
