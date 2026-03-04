import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer, canSplit, canDoubleDown, canSurrender } from './gameEngine.js';
import { Phase, Result, Action } from './constants.js';

// Helper: create a state with a known shoe for deterministic tests
function stateWithShoe(cards, overrides = {}) {
  const base = createInitialState({ deckCount: 1 });
  return {
    ...base,
    shoe: [...cards].reverse(), // reverse so first card in array is drawn first
    ...overrides,
  };
}

// Helper: make a card
function card(rank, suit = 'H') {
  return { rank, suit };
}

// Helper: run through bet and deal
function betAndDeal(state, betAmount = 100) {
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
    // Shoe: P1, D1, P2, D2(faceDown)
    const shoe = [
      card('5'), card('8'), card('7'), card('3'),
      // extra cards
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
    // Blackjack pays 3:2: bet 100, payout = 100 + 150 = 250
    expect(dealt.chips).toBe(1000 - 100 + 250);
  });

  it('detects both naturals as push', () => {
    const shoe = [card('A'), card('K'), card('K'), card('A')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].result).toBe(Result.PUSH);
    expect(dealt.phase).toBe(Phase.SETTLED);
    expect(dealt.chips).toBe(1000); // bet returned
  });

  it('detects dealer blackjack with 10-value up card', () => {
    const shoe = [card('5'), card('K'), card('7'), card('A')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.hands[0].result).toBe(Result.DEALER_WIN);
    expect(dealt.phase).toBe(Phase.SETTLED);
    expect(dealt.chips).toBe(900); // lost bet
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
    // Cards: P1=5, D1=8, P2=7, D2=3, next=4
    const shoe = [card('5'), card('8'), card('7'), card('3'), card('4')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    expect(hit.hands[0].cards).toHaveLength(3);
    expect(hit.phase).toBe(Phase.PLAYER_TURN);
  });

  it('detects bust on hit', () => {
    // P1=K, D1=8, P2=7, D2=3, next=K (17 + 10 = bust)
    const shoe = [card('K'), card('8'), card('7'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    expect(hit.hands[0].result).toBe(Result.PLAYER_BUST);
  });

  it('auto-stands on 21', () => {
    // P1=6, D1=8, P2=5, D2=3, next=K (6+5+10=21)
    const shoe = [card('6'), card('8'), card('5'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const hit = gameReducer(dealt, { type: Action.HIT });

    // Should have advanced to dealer turn (since hand auto-stands at 21)
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
    // Dealer's faceDown card should be revealed
    expect(stood.dealerHand[1].faceDown).toBe(false);
  });
});

describe('DEALER_HIT', () => {
  it('dealer hits on 16', () => {
    // Set up state where dealer has 16 and needs to hit
    const shoe = [card('5')]; // dealer will draw this
    const state = {
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
    const state = {
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
    expect(next.dealerHand).toHaveLength(2); // did not draw
  });

  it('dealer hits soft 17 when dealerHitsSoft17 is true', () => {
    const state = {
      ...createInitialState({ dealerHitsSoft17: true }),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('A'), card('6')], // soft 17
      shoe: [card('3')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.dealerHand).toHaveLength(3); // drew a card
  });

  it('dealer stands soft 17 when dealerHitsSoft17 is false', () => {
    const state = {
      ...createInitialState({ dealerHitsSoft17: false }),
      phase: Phase.DEALER_TURN,
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100, result: null, isDoubled: false, isSurrendered: false, fromSplit: false,
      }],
      dealerHand: [card('A'), card('6')], // soft 17
      shoe: [card('3')],
      chips: 900,
    };

    const next = gameReducer(state, { type: Action.DEALER_HIT });
    expect(next.phase).toBe(Phase.RESOLVING);
    expect(next.dealerHand).toHaveLength(2); // did not draw
  });
});

describe('SETTLE', () => {
  it('player wins when beating dealer', () => {
    const state = {
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
    expect(next.chips).toBe(1100); // 900 + 200
    expect(next.stats.wins).toBe(1);
    expect(next.phase).toBe(Phase.SETTLED);
  });

  it('dealer wins when beating player', () => {
    const state = {
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
    const state = {
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
    expect(next.chips).toBe(1000); // bet returned
    expect(next.stats.pushes).toBe(1);
  });

  it('player wins on dealer bust', () => {
    const state = {
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
    const state = {
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
    expect(next.hands[0].result).toBe(Result.PLAYER_BUST); // unchanged
    expect(next.chips).toBe(900); // no payout
  });
});

describe('DOUBLE_DOWN', () => {
  it('doubles bet, draws one card, then advances', () => {
    // P1=5, D1=8, P2=6, D2=3, next=K (5+6+10=21)
    const shoe = [card('5'), card('8'), card('6'), card('3'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    const doubled = gameReducer(dealt, { type: Action.DOUBLE_DOWN });

    expect(doubled.hands[0].cards).toHaveLength(3);
    expect(doubled.hands[0].bet).toBe(200);
    expect(doubled.hands[0].isDoubled).toBe(true);
    expect(doubled.chips).toBe(800); // 1000 - 100 (initial) - 100 (double)
  });

  it('rejects with insufficient chips', () => {
    const shoe = [card('5'), card('8'), card('6'), card('3'), card('K')];
    const state = stateWithShoe(shoe, { chips: 100 });
    // After betting 100, chips = 0, cannot double
    const dealt = betAndDeal(state);
    expect(() => gameReducer(dealt, { type: Action.DOUBLE_DOWN })).toThrow('Insufficient');
  });
});

describe('SPLIT', () => {
  it('splits matching cards into two hands', () => {
    // P1=8, D1=5, P2=8, D2=3, then two more cards for split hands
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
    expect(split.chips).toBe(800); // 1000 - 100 - 100
  });

  it('rejects splitting non-matching cards', () => {
    const shoe = [card('8'), card('5'), card('7'), card('3')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);
    expect(() => gameReducer(dealt, { type: Action.SPLIT })).toThrow('same value');
  });

  it('allows splitting 10-value cards of different ranks', () => {
    // K and Q both have value 10
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
    // Dealer shows Ace, hole card is K (blackjack)
    const shoe = [card('5'), card('A'), card('7'), card('K')];
    const state = stateWithShoe(shoe);
    const dealt = betAndDeal(state);

    expect(dealt.insuranceOffered).toBe(true);
    const insured = gameReducer(dealt, { type: Action.INSURANCE });

    // Insurance bet = 50 (half of 100)
    // Insurance pays: 50 + 50*2 = 150
    // Main bet lost: -100
    // Net from starting: 1000 - 100 (bet) - 50 (insurance) + 150 (insurance payout) = 1000
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
    // Lost the 50 insurance bet
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
    expect(declined.chips).toBe(900); // no insurance cost
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
    expect(surrendered.chips).toBe(950); // 1000 - 100 + 50
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
    const state = {
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
    const hand = { cards: [card('8'), card('8', 'S')], bet: 100, fromSplit: false };
    expect(canSplit(hand, 100)).toBe(true);
  });

  it('returns false for non-matching ranks', () => {
    const hand = { cards: [card('8'), card('7')], bet: 100, fromSplit: false };
    expect(canSplit(hand, 100)).toBe(false);
  });

  it('returns true for different 10-value cards', () => {
    const hand = { cards: [card('K'), card('Q')], bet: 100, fromSplit: false };
    expect(canSplit(hand, 100)).toBe(true);
  });

  it('returns false if already from split', () => {
    const hand = { cards: [card('8'), card('8', 'S')], bet: 100, fromSplit: true };
    expect(canSplit(hand, 100)).toBe(false);
  });

  it('returns false with insufficient chips', () => {
    const hand = { cards: [card('8'), card('8', 'S')], bet: 100, fromSplit: false };
    expect(canSplit(hand, 50)).toBe(false);
  });
});

describe('canDoubleDown', () => {
  it('returns true with two cards and enough chips', () => {
    const hand = { cards: [card('5'), card('6')], bet: 100 };
    expect(canDoubleDown(hand, 100)).toBe(true);
  });

  it('returns false with three cards', () => {
    const hand = { cards: [card('5'), card('6'), card('3')], bet: 100 };
    expect(canDoubleDown(hand, 100)).toBe(false);
  });
});

describe('canSurrender', () => {
  it('returns true with two cards not from split', () => {
    const hand = { cards: [card('5'), card('6')], fromSplit: false };
    expect(canSurrender(hand)).toBe(true);
  });

  it('returns false from split', () => {
    const hand = { cards: [card('5'), card('6')], fromSplit: true };
    expect(canSurrender(hand)).toBe(false);
  });
});
