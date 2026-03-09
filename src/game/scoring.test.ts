import { describe, it, expect } from 'vitest';
import { evaluateHand, evaluateHandFull } from './scoring';

describe('evaluateHandFull', () => {
  it('scores an empty hand as 0', () => {
    const result = evaluateHandFull([]);
    expect(result.value).toBe(0);
    expect(result.isSoft).toBe(false);
    expect(result.isBlackjack).toBe(false);
    expect(result.isBust).toBe(false);
  });

  it('scores number cards at face value', () => {
    const cards = [
      { rank: '5', suit: 'H' },
      { rank: '3', suit: 'S' },
    ];
    expect(evaluateHandFull(cards).value).toBe(8);
  });

  it('scores face cards as 10', () => {
    expect(evaluateHandFull([{ rank: 'J', suit: 'H' }]).value).toBe(10);
    expect(evaluateHandFull([{ rank: 'Q', suit: 'D' }]).value).toBe(10);
    expect(evaluateHandFull([{ rank: 'K', suit: 'S' }]).value).toBe(10);
  });

  it('scores Ace as 11 when it does not bust', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: '6', suit: 'S' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(17);
    expect(result.isSoft).toBe(true);
  });

  it('scores Ace as 1 when 11 would bust', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: '6', suit: 'S' },
      { rank: 'K', suit: 'D' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(17);
    expect(result.isSoft).toBe(false);
  });

  it('scores two Aces as 12 (one as 11, one as 1)', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: 'A', suit: 'S' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(12);
    expect(result.isSoft).toBe(true);
  });

  it('scores two Aces plus 9 as 21 (not blackjack)', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: 'A', suit: 'S' },
      { rank: '9', suit: 'D' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(21);
    expect(result.isBlackjack).toBe(false);
    expect(result.isSoft).toBe(true);
  });

  it('detects natural blackjack (Ace + 10-value)', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: 'K', suit: 'S' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(21);
    expect(result.isBlackjack).toBe(true);
    expect(result.isSoft).toBe(true);
  });

  it('does not count 3-card 21 as blackjack', () => {
    const cards = [
      { rank: '7', suit: 'H' },
      { rank: '7', suit: 'S' },
      { rank: '7', suit: 'D' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(21);
    expect(result.isBlackjack).toBe(false);
  });

  it('detects bust', () => {
    const cards = [
      { rank: 'K', suit: 'H' },
      { rank: 'Q', suit: 'S' },
      { rank: '5', suit: 'D' },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(25);
    expect(result.isBust).toBe(true);
  });

  it('includes faceDown cards in evaluation', () => {
    const cards = [
      { rank: 'K', suit: 'H' },
      { rank: 'Q', suit: 'S', faceDown: true },
    ];
    const result = evaluateHandFull(cards);
    expect(result.value).toBe(20);
  });
});

describe('evaluateHand', () => {
  it('excludes faceDown cards from evaluation', () => {
    const cards = [
      { rank: 'K', suit: 'H' },
      { rank: 'Q', suit: 'S', faceDown: true },
    ];
    const result = evaluateHand(cards);
    expect(result.value).toBe(10);
  });

  it('scores visible cards normally', () => {
    const cards = [
      { rank: 'A', suit: 'H' },
      { rank: '5', suit: 'S' },
      { rank: '3', suit: 'D', faceDown: true },
    ];
    const result = evaluateHand(cards);
    expect(result.value).toBe(16);
    expect(result.isSoft).toBe(true);
  });
});
