import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer, canSplit, canDoubleDown, canSurrender, isBankrupt } from './gameEngine';
import type { GameState, Hand } from './gameEngine';
import type { Card } from './deck';
import { Phase, Result, Action } from './constants';

function stateWithShoe(cards: Card[], overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState({ deckCount: 1 });
  return {
    ...base,
    shoe: [...cards].reverse(),
    ...overrides,
  };
}

function card(rank: string, suit = 'H'): Card {
  return { rank, suit };
}

function betAndDeal(state: GameState, betAmount = 100): GameState {
  let s = gameReducer(state, { type: Action.PLACE_BET, payload: betAmount });
  s = gameReducer(s, { type: Action.DEAL });
  return s;
}

describe('PLACE_BET', () => {
  it('deducts chips and transitions to DEALING', () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: Action.PLACE_BET, payload: 100 });
    expect(next.phase).toBe(Phase.DEALING);
    expect(next.chips).toBe(900);
    expect(next.hands[0].bet).toBe(100);
  });

  it('rejects bet below minimum', () => {
    const state = createInitialState();
    expect(() => gameReducer(state, { type: Action.PLACE_BET, payload: 5 })).toThrow('at least');
  });

  it('rejects bet above maximum', () => {
    const state = createInitialState();
    expect(() => gameReducer(state, { type: Action.PLACE_BET, payload: 1000 })).toThrow('exceed');
  });

  it('rejects bet exceeding chips', () => {
    const state = createInitialState({ startingChips: 50 });
    expect(() => gameReducer(state, { type: Action.PLACE_BET, payload: 100 })).toThrow('Insufficient');
  });

  it('rejects bet outside BETTING phase', () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: Action.PLACE_BET, payload: 100 });
    expect(() => gameReducer(next, { type: Action.PLACE_BET, payload: 100 })).toThrow();
  });
});

describe('DEAL', () => {
  it('deals 4 cards (2 to player, 2 to dealer)', () => {
    const shoe = [
      card('5'), card('8'), card('7'), card('3'),
      card('2'), card('2'), card('2'), card('2'),
    ];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].cards).toHaveLength(2);
    expect(dealt.dealerHand).toHaveLength(2);
    expect(dealt.dealerHand[1].faceDown).toBe(true);
    expect(dealt.phase).toBe(Phase.PLAYER_TURN);
  });

  it('detects player natural blackjack', () => {
    const shoe = [card('A'), card('5'), card('K'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].result).toBe(Result.PLAYER_BLACKJACK);
    expect(dealt.phase).toBe(Phase.SETTLED);
    expect(dealt.chips).toBe(1000 - 100 + 250);
  });

  it('detects both naturals as push', () => {
    const shoe = [card('A'), card('K'), card('K'), card('A')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].result).toBe(Result.PUSH);
    expect(dealt.phase).toBe(Phase.SETTLED);
    expect(dealt.chips).toBe(1000);
  });

  it('detects dealer blackjack with 10-value up card', () => {
    const shoe = [card('5'), card('K'), card('7'), card('A')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].result).toBe(Result.DEALER_WIN);
    expect(dealt.phase).toBe(Phase.SETTLED);
    expect(dealt.chips).toBe(900);
  });

  it('offers insurance when dealer shows Ace', () => {
    const shoe = [card('5'), card('A'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.insuranceOffered).toBe(true);
    expect(dealt.insuranceDecided).toBe(false);
    expect(dealt.phase).toBe(Phase.PLAYER_TURN);
  });
});

describe('HIT', () => {
  it('adds a card to the active hand', () => {
    const shoe = [card('5'), card('8'), card('7'), card('3'), card('4')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    expect(hit.hands[0].cards).toHaveLength(3);
    expect(hit.phase).toBe(Phase.PLAYER_TURN);
  });

  it('detects bust on hit', () => {
    const shoe = [card('K'), card('8'), card('7'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    expect(hit.hands[0].result).toBe(Result.PLAYER_BUST);
  });

  it('auto-stands on 21', () => {
    const shoe = [card('6'), card('8'), card('5'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    expect(hit.phase).toBe(Phase.DEALER_TURN);
  });
});

describe('STAND', () => {
  it('transitions to dealer turn', () => {
    const shoe = [card('K'), card('8'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const stood = gameReducer(dealt, { type: Action.STAND });

    expect(stood.phase).toBe(Phase.DEALER_TURN);
    expect(stood.dealerHand[1].faceDown).toBe(false);
  });
});

describe('DEALER_HIT', () => {
  it('dealer hits on 16', () => {
    const shoe = [card('5')];
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('6')],
      shoe,
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.dealerHand).toHaveLength(3);
  });

  it('dealer stands on hard 17', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('7')],
      shoe: [card('5')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.phase).toBe(Phase.RESOLVING);
    expect(next.dealerHand).toHaveLength(2);
  });

  it('dealer hits soft 17 when dealerHitsSoft17 is true', () => {
    const state: GameState = {
      ...createInitialState({ dealerHitsSoft17: true }),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('A'), card('6')],
      shoe: [card('3')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.dealerHand).toHaveLength(3);
  });

  it('dealer stands soft 17 when dealerHitsSoft17 is false', () => {
    const state: GameState = {
      ...createInitialState({ dealerHitsSoft17: false }),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('A'), card('6')],
      shoe: [card('3')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.phase).toBe(Phase.RESOLVING);
    expect(next.dealerHand).toHaveLength(2);
  });
});

describe('SETTLE', () => {
  it('player wins when beating dealer', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.RESOLVING,
      hands: [{
        cards: [card('K'), card('9')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('7')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.SETTLE });
    expect(next.hands[0].result).toBe(Result.PLAYER_WIN);
    expect(next.chips).toBe(1100);
    expect(next.stats.wins).toBe(1);
    expect(next.phase).toBe(Phase.SETTLED);
  });

  it('dealer wins when beating player', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.RESOLVING,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('9')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.SETTLE });
    expect(next.hands[0].result).toBe(Result.DEALER_WIN);
    expect(next.chips).toBe(900);
    expect(next.stats.losses).toBe(1);
  });

  it('push when equal values', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.RESOLVING,
      hands: [{
        cards: [card('K'), card('8')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('8')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.SETTLE });
    expect(next.hands[0].result).toBe(Result.PUSH);
    expect(next.chips).toBe(1000);
    expect(next.stats.pushes).toBe(1);
  });

  it('player wins on dealer bust', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.RESOLVING,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('Q'), card('5')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.SETTLE });
    expect(next.hands[0].result).toBe(Result.DEALER_BUST);
    expect(next.chips).toBe(1100);
  });

  it('skips hands that already have a result', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.RESOLVING,
      hands: [{
        cards: [card('K'), card('Q'), card('5')],
        bet: 100, result: Result.PLAYER_BUST, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('7')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.SETTLE });
    expect(next.hands[0].result).toBe(Result.PLAYER_BUST);
    expect(next.chips).toBe(900);
  });
});

describe('DOUBLE_DOWN', () => {
  it('doubles bet, draws one card, then advances', () => {
    const shoe = [card('5'), card('8'), card('6'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const doubled = gameReducer(dealt, { type: Action.DOUBLE_DOWN });

    expect(doubled.hands[0].cards).toHaveLength(3);
    expect(doubled.hands[0].bet).toBe(200);
    expect(doubled.hands[0].isDoubled).toBe(true);
    expect(doubled.chips).toBe(800);
  });

  it('rejects with insufficient chips', () => {
    const shoe = [card('5'), card('8'), card('6'), card('3'), card('K')];
    const state = stateWithShoe(shoe, { chips: 100 });
    const dealt = betAndDeal(state);
    expect(() => gameReducer(dealt, { type: Action.DOUBLE_DOWN })).toThrow('Insufficient');
  });
});

describe('SPLIT', () => {
  it('splits matching cards into two hands', () => {
    const shoe = [card('8'), card('5'), card('8', 'S'), card('3'), card('6'), card('7')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const split = gameReducer(dealt, { type: Action.SPLIT });

    expect(split.hands).toHaveLength(2);
    expect(split.hands[0].cards).toHaveLength(2);
    expect(split.hands[1].cards).toHaveLength(2);
    expect(split.hands[0].bet).toBe(100);
    expect(split.hands[1].bet).toBe(100);
    expect(split.hands[0].fromSplit).toBe(true);
    expect(split.chips).toBe(800);
  });

  it('rejects splitting non-matching cards', () => {
    const shoe = [card('8'), card('5'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    expect(() => gameReducer(dealt, { type: Action.SPLIT })).toThrow('Cannot split');
  });

  it('allows splitting 10-value cards of different ranks', () => {
    const shoe = [card('K'), card('5'), card('Q'), card('3'), card('6'), card('7')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const split = gameReducer(dealt, { type: Action.SPLIT });

    expect(split.hands).toHaveLength(2);
  });

  it('split aces auto-advance to dealer turn', () => {
    const shoe = [card('A'), card('5'), card('A', 'S'), card('3'), card('6'), card('7')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const split = gameReducer(dealt, { type: Action.SPLIT });

    expect(split.phase).toBe(Phase.DEALER_TURN);
  });
});

describe('INSURANCE', () => {
  it('pays 2:1 when dealer has blackjack', () => {
    const shoe = [card('5'), card('A'), card('7'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.insuranceOffered).toBe(true);
    const insured = gameReducer(dealt, { type: Action.INSURANCE });

    expect(insured.phase).toBe(Phase.SETTLED);
    expect(insured.hands[0].result).toBe(Result.DEALER_WIN);
  });

  it('loses insurance when dealer does not have blackjack', () => {
    const shoe = [card('5'), card('A'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const insured = gameReducer(dealt, { type: Action.INSURANCE });

    expect(insured.phase).toBe(Phase.PLAYER_TURN);
    expect(insured.insuranceDecided).toBe(true);
    expect(insured.chips).toBe(1000 - 100 - 50);
  });
});

describe('DECLINE_INSURANCE', () => {
  it('continues play when dealer does not have blackjack', () => {
    const shoe = [card('5'), card('A'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const declined = gameReducer(dealt, { type: Action.DECLINE_INSURANCE });

    expect(declined.phase).toBe(Phase.PLAYER_TURN);
    expect(declined.insuranceDecided).toBe(true);
    expect(declined.chips).toBe(900);
  });

  it('dealer wins when has blackjack and insurance declined', () => {
    const shoe = [card('5'), card('A'), card('7'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const declined = gameReducer(dealt, { type: Action.DECLINE_INSURANCE });

    expect(declined.phase).toBe(Phase.SETTLED);
    expect(declined.hands[0].result).toBe(Result.DEALER_WIN);
  });
});

describe('SURRENDER', () => {
  it('returns half the bet', () => {
    const shoe = [card('K'), card('8'), card('6'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const surrendered = gameReducer(dealt, { type: Action.SURRENDER });

    expect(surrendered.hands[0].result).toBe(Result.SURRENDER);
    expect(surrendered.chips).toBe(950);
    expect(surrendered.phase).toBe(Phase.SETTLED);
  });

  it('rejects surrender after hitting', () => {
    const shoe = [card('5'), card('8'), card('6'), card('3'), card('2')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });
    expect(() => gameReducer(hit, { type: Action.SURRENDER })).toThrow('initial two cards');
  });
});

describe('NEW_ROUND', () => {
  it('resets state for new round', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.SETTLED,
      hands: [{
        cards: [card('K'), card('9')],
        bet: 100, result: Result.PLAYER_WIN, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('7')],
    };

    const next = gameReducer(state, { type: Action.NEW_ROUND });
    expect(next.phase).toBe(Phase.BETTING);
    expect(next.hands).toHaveLength(1);
    expect(next.hands[0].cards).toHaveLength(0);
    expect(next.dealerHand).toHaveLength(0);
    expect(next.insuranceOffered).toBe(false);
  });
});

describe('canSplit', () => {
  it('returns true for matching ranks', () => {
    const hand: Hand = { cards: [card('8'), card('8', 'S')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canSplit(hand, 100, 1, 4)).toBe(true);
  });

  it('returns false for non-matching ranks', () => {
    const hand: Hand = { cards: [card('8'), card('7')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canSplit(hand, 100, 1, 4)).toBe(false);
  });

  it('returns true for different 10-value cards', () => {
    const hand: Hand = { cards: [card('K'), card('Q')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canSplit(hand, 100, 1, 4)).toBe(true);
  });

  it('allows re-splitting when under max hands', () => {
    const hand: Hand = { cards: [card('8'), card('8', 'S')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: true };
    expect(canSplit(hand, 100, 2, 4)).toBe(true);
  });

  it('returns false when at max split hands', () => {
    const hand: Hand = { cards: [card('8'), card('8', 'S')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: true };
    expect(canSplit(hand, 100, 4, 4)).toBe(false);
  });

  it('returns false with insufficient chips', () => {
    const hand: Hand = { cards: [card('8'), card('8', 'S')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canSplit(hand, 50, 1, 4)).toBe(false);
  });
});

describe('canDoubleDown', () => {
  it('returns true with two cards and enough chips', () => {
    const hand: Hand = { cards: [card('5'), card('6')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canDoubleDown(hand, 100)).toBe(true);
  });

  it('returns false with three cards', () => {
    const hand: Hand = { cards: [card('5'), card('6'), card('3')], bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canDoubleDown(hand, 100)).toBe(false);
  });
});

describe('canSurrender', () => {
  it('returns true with two cards not from split', () => {
    const hand: Hand = { cards: [card('5'), card('6')], bet: 0, result: null, isDoubled: false, isSurrendered: false, fromSplit: false };
    expect(canSurrender(hand)).toBe(true);
  });

  it('returns false from split', () => {
    const hand: Hand = { cards: [card('5'), card('6')], bet: 0, result: null, isDoubled: false, isSurrendered: false, fromSplit: true };
    expect(canSurrender(hand)).toBe(false);
  });
});

describe('Re-splitting', () => {
  it('allows splitting a hand that came from a split', () => {
    const shoe = [
      card('8'), card('5'), card('8', 'S'), card('3'),
      card('8', 'C'), card('7'),
      card('6'), card('9'),
    ];
    const state = stateWithShoe(shoe, { chips: 1000 });
    const dealt = betAndDeal(state);

    const split1 = gameReducer(dealt, { type: Action.SPLIT });
    expect(split1.hands).toHaveLength(2);
    expect(split1.hands[0].cards[0].rank).toBe('8');
    expect(split1.hands[0].cards[1].rank).toBe('8');

    const split2 = gameReducer(split1, { type: Action.SPLIT });
    expect(split2.hands).toHaveLength(3);
    expect(split2.chips).toBe(1000 - 100 - 100 - 100);
  });

  it('blocks splitting when at max hands', () => {
    const shoe = [
      card('8'), card('5'), card('8', 'S'), card('3'),
      card('8', 'C'), card('7'),
      card('6'), card('9'),
    ];
    const state = stateWithShoe(shoe, { chips: 1000 });
    state.config.maxSplitHands = 2;
    const dealt = betAndDeal(state);

    const split1 = gameReducer(dealt, { type: Action.SPLIT });
    expect(split1.hands).toHaveLength(2);

    expect(() => gameReducer(split1, { type: Action.SPLIT })).toThrow('Cannot split');
  });
});

describe('EVEN_MONEY', () => {
  it('offers even money when player has blackjack and dealer shows Ace', () => {
    const shoe = [card('A'), card('A', 'S'), card('K'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.evenMoneyOffered).toBe(true);
    expect(dealt.evenMoneyDecided).toBe(false);
    expect(dealt.phase).toBe('player-turn');
  });

  it('pays 1:1 immediately when even money accepted', () => {
    const shoe = [card('A'), card('A', 'S'), card('K'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const even = gameReducer(dealt, { type: Action.EVEN_MONEY });

    expect(even.phase).toBe('settled');
    expect(even.hands[0].result).toBe(Result.PLAYER_BLACKJACK);
    expect(even.chips).toBe(1100);
  });

  it('pays 3:2 when even money declined and dealer has no blackjack', () => {
    const shoe = [card('A'), card('A', 'S'), card('K'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const declined = gameReducer(dealt, { type: Action.DECLINE_EVEN_MONEY });

    expect(declined.phase).toBe('settled');
    expect(declined.hands[0].result).toBe(Result.PLAYER_BLACKJACK);
    expect(declined.chips).toBe(1150);
  });

  it('pushes when even money declined and dealer also has blackjack', () => {
    const shoe = [card('A'), card('A', 'S'), card('K'), card('K', 'S')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const declined = gameReducer(dealt, { type: Action.DECLINE_EVEN_MONEY });

    expect(declined.phase).toBe('settled');
    expect(declined.hands[0].result).toBe(Result.PUSH);
    expect(declined.chips).toBe(1000);
  });
});

describe('REBUY', () => {
  it('resets chips to starting amount when bankrupt', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.SETTLED,
      chips: 0,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: Result.DEALER_WIN, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('9')],
    };

    const rebuyed = gameReducer(state, { type: Action.REBUY });
    expect(rebuyed.chips).toBe(1000);
  });

  it('rejects rebuy when player still has chips to play', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: Phase.SETTLED,
      chips: 100,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: Result.DEALER_WIN, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('K'), card('9')],
    };

    expect(() => gameReducer(state, { type: Action.REBUY })).toThrow('still have chips');
  });

  it('rejects rebuy outside SETTLED phase', () => {
    const state = createInitialState();
    expect(() => gameReducer(state, { type: Action.REBUY })).toThrow();
  });
});

describe('isBankrupt', () => {
  it('returns true when chips below minimum bet', () => {
    expect(isBankrupt(5, 10)).toBe(true);
  });

  it('returns false when chips at or above minimum bet', () => {
    expect(isBankrupt(10, 10)).toBe(false);
    expect(isBankrupt(100, 10)).toBe(false);
  });
});
