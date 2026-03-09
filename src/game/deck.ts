import shuffle from 'lodash/shuffle';

export interface Card {
  rank: string;
  suit: string;
  faceDown?: boolean;
}

const SUITS = ['H', 'D', 'S', 'C'] as const;
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function createShoe(deckCount = 6): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createDeck());
  }
  return shuffle(shoe);
}

export function drawCard(shoe: Card[]): [Card, Card[]] {
  if (shoe.length === 0) {
    throw new Error('Shoe is empty');
  }
  const card = shoe[shoe.length - 1];
  const remaining = shoe.slice(0, -1);
  return [card, remaining];
}

export function needsReshuffle(shoe: Card[], deckCount = 6, threshold = 0.75): boolean {
  const totalCards = deckCount * 52;
  const cardsDealt = totalCards - shoe.length;
  return cardsDealt / totalCards >= threshold;
}
