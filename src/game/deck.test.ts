import { describe, it, expect } from 'vitest';
import { createDeck, createShoe, drawCard, needsReshuffle } from './deck';

describe('createDeck', () => {
  it('creates 52 cards', () => {
    expect(createDeck()).toHaveLength(52);
  });

  it('has 4 of each rank', () => {
    const deck = createDeck();
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    for (const rank of ranks) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(4);
    }
  });

  it('has 13 of each suit', () => {
    const deck = createDeck();
    const suits = ['H', 'D', 'S', 'C'];
    for (const suit of suits) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });
});

describe('createShoe', () => {
  it('creates correct number of cards for multi-deck shoe', () => {
    expect(createShoe(6)).toHaveLength(312);
    expect(createShoe(1)).toHaveLength(52);
    expect(createShoe(8)).toHaveLength(416);
  });
});

describe('drawCard', () => {
  it('returns the last card and remaining shoe', () => {
    const shoe = [
      { rank: '2', suit: 'H' },
      { rank: '3', suit: 'S' },
      { rank: 'A', suit: 'D' },
    ];
    const [card, remaining] = drawCard(shoe);
    expect(card).toEqual({ rank: 'A', suit: 'D' });
    expect(remaining).toHaveLength(2);
    expect(remaining).toEqual([
      { rank: '2', suit: 'H' },
      { rank: '3', suit: 'S' },
    ]);
  });

  it('throws on empty shoe', () => {
    expect(() => drawCard([])).toThrow('Shoe is empty');
  });

  it('does not mutate the original shoe', () => {
    const shoe = [
      { rank: '2', suit: 'H' },
      { rank: '3', suit: 'S' },
    ];
    drawCard(shoe);
    expect(shoe).toHaveLength(2);
  });
});

describe('needsReshuffle', () => {
  it('returns false when shoe is full', () => {
    const shoe = createShoe(6);
    expect(needsReshuffle(shoe, 6, 0.75)).toBe(false);
  });

  it('returns true when past threshold', () => {
    const totalCards = 6 * 52;
    const shoe = new Array(Math.floor(totalCards * 0.2));
    expect(needsReshuffle(shoe, 6, 0.75)).toBe(true);
  });

  it('returns false when just below threshold', () => {
    const totalCards = 6 * 52;
    const shoe = new Array(Math.floor(totalCards * 0.3));
    expect(needsReshuffle(shoe, 6, 0.75)).toBe(false);
  });
});
