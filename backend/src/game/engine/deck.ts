import { Card, CardId, Player, CardValue } from '../game.types'
import { CARD_VALUES, CARD_COLORS } from '../game.types'

export const PLAYERS_COUNT = 4;
export const CARDS_PER_HAND = 5;

export function cardValueOf(cardId: CardId): CardValue
{
	const [color, value] = cardId.split('_');

	return (Number(value) as CardValue);
}

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

	const shuffled = [...cards];

	// Fisher-Yates : de la fin vers le debut, on echange chaque carte
	// avec une carte tiree dans la partie pas encore melangee [0, i]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // i + 1 pour que i soit atteignable
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

//le debut du tableau de cartes = le dessus de la draw pile.
export function dealCards(drawPile: Card[], discardPile: Card[])
	: { hands: Card[][], drawPile: Card[], discardPile: Card[] }
{
	let pile = [...drawPile];
	let discard = [...discardPile];

	// pioche trop courte : on remelange la defausse et on la glisse dessous.
	if (pile.length < PLAYERS_COUNT * CARDS_PER_HAND)
	{
		const reshuffled = shuffleDeck(discard);
		pile = pile.concat(reshuffled);
		discard = [];
	}

	const hands: Card[][] = [];

	for (let i = 0 ; i < PLAYERS_COUNT; i++)
	{
		// splice retire les cartes de la pioche et les return
		hands.push(pile.splice(0, CARDS_PER_HAND));
	}

	return {hands, drawPile: pile , discardPile: discard};
}

export function playCard(hand: Card[], discardPile: Card[], cardId: CardId)
	: {hand: Card[], discardPile: Card[]} | null
{
	//on check si la card existe dans la hand du joueur !
	const index = hand.findIndex(card => card.id === cardId);

	if (index === -1){
		return null;
	}
	let discard = [...discardPile];
	let newHand= [...hand];

	const played = newHand.splice(index, 1)[0];
	discard = discard.concat(played);

	return {hand: newHand, discardPile : discard};
}

export function isRoundOver(players: Player[]) : boolean
{
	let count = 0;

	for (let i = 0; i < players.length; i++)
	{
		if (players[i].hand.length === 0)
			count++;
	}
	return (count === players.length);
}
