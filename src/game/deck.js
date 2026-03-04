import shuffle from 'lodash/shuffle';

const SUITS = ['H', 'D', 'S', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function createShoe(deckCount = 6) {
  const shoe = [];
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createDeck());
  }
  return shuffle(shoe);
}

export function drawCard(shoe) {
  if (shoe.length === 0) {
    throw new Error('Shoe is empty');
  }
  const card = shoe[shoe.length - 1];
  const remaining = shoe.slice(0, -1);
  return [card, remaining];
}

export function needsReshuffle(shoe, deckCount = 6, threshold = 0.75) {
  const totalCards = deckCount * 52;
  const cardsDealt = totalCards - shoe.length;
  return cardsDealt / totalCards >= threshold;
}
