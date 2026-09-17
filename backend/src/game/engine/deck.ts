import { Card, CardColor } from '../game.types'
import { CARD_VALUES, CARD_COLORS } from '../game.types'

export function createDeck(): Card[] {

	const cards: Card[] = [];

	CARD_COLORS.forEach(color => {
			CARD_VALUES.forEach(value => {
				//color = color: color
				cards.push({id: `${color}_${value}`, color, value})
			});
	});
	return cards;
};

export function shuffleDeck(cards: Card[]) : Card[] {


	return cards;
}
