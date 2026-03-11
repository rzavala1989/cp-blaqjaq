import { describe, it, expect } from 'vitest';
import { buildHandRecord, deriveSessionStats, createEmptySessionStats } from './analytics';
import type { HandRecord } from './analytics';
import { createInitialState } from './gameEngine';
import type { GameState } from './gameEngine';
import type { Card } from './deck';
import { Phase, Result, Action, DEFAULT_CONFIG } from './constants';
import type { ActionValue } from './constants';

function card(rank: string, suit = 'H'): Card {
  return { rank, suit };
}

function makeSettledState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState({ deckCount: 6 });
  return {
    ...base,
    phase: Phase.SETTLED as GameState['phase'],
    ...overrides,
  };
}

describe('buildHandRecord', () => {
  it('builds a record for a player win (K+9 vs K+7)', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('9')],
        bet: 100,
        result: Result.PLAYER_WIN,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('K', 'S'), card('7', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 1100,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 1, [Action.STAND], 1000);

    expect(record.id).toBe(1);
    expect(record.playerCards).toEqual([card('K'), card('9')]);
    expect(record.dealerCards).toEqual([card('K', 'S'), card('7', 'D')]);
    expect(record.dealerUpcard).toEqual(card('K', 'S'));
    expect(record.playerFinalValue).toBe(19);
    expect(record.dealerFinalValue).toBe(17);
    expect(record.bet).toBe(100);
    expect(record.payout).toBe(100);
    expect(record.result).toBe(Result.PLAYER_WIN);
    expect(record.actionsSequence).toEqual([Action.STAND]);
    expect(record.actualAction).toBe(Action.STAND);
    expect(record.chipsBefore).toBe(1000);
    expect(record.chipsAfter).toBe(1100);
    expect(record.handType).toBe('hard');
    expect(record.splitOccurred).toBe(false);
    expect(record.doubleOccurred).toBe(false);
    expect(record.surrenderOccurred).toBe(false);
    expect(record.insuranceTaken).toBe(false);
    expect(record.dealerBusted).toBe(false);
    expect(record.shoeDepth).toBeGreaterThan(0);
    expect(record.shoeDepth).toBeLessThan(1);
  });

  it('builds a record for a player bust', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('6'), card('Q')],
        bet: 50,
        result: Result.PLAYER_BUST,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('8', 'S'), card('J', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 950,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 2, [Action.HIT], 1000);

    expect(record.id).toBe(2);
    expect(record.playerFinalValue).toBe(26);
    expect(record.dealerFinalValue).toBe(18);
    expect(record.payout).toBe(-50);
    expect(record.result).toBe(Result.PLAYER_BUST);
    expect(record.actualAction).toBe(Action.HIT);
    expect(record.handType).toBe('hard');
    expect(record.dealerBusted).toBe(false);
  });

  it('builds a record for a blackjack', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('A'), card('K')],
        bet: 100,
        result: Result.PLAYER_BLACKJACK,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('8', 'S'), card('9', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 1250,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 3, [], 1000);

    expect(record.payout).toBe(150); // 100 * 1.5
    expect(record.result).toBe(Result.PLAYER_BLACKJACK);
    expect(record.handType).toBe('soft');
    expect(record.actualAction).toBeNull();
  });

  it('builds a record for a surrender', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('6')],
        bet: 100,
        result: Result.SURRENDER,
        isDoubled: false,
        isSurrendered: true,
        fromSplit: false,
      }],
      dealerHand: [card('K', 'S'), card('7', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 950,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 4, [Action.SURRENDER], 1000);

    expect(record.payout).toBe(-50);
    expect(record.surrenderOccurred).toBe(true);
  });

  it('builds a record for a dealer bust', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('7')],
        bet: 100,
        result: Result.DEALER_BUST,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('6', 'S'), card('J', 'D'), card('Q', 'C')],
      shoe: new Array(300).fill(card('2')),
      chips: 1100,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 5, [Action.STAND], 1000);

    expect(record.payout).toBe(100);
    expect(record.dealerBusted).toBe(true);
    expect(record.dealerFinalValue).toBe(26);
  });

  it('detects doubled hand', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('5'), card('6'), card('K')],
        bet: 200,
        result: Result.PLAYER_WIN,
        isDoubled: true,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('8', 'S'), card('9', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 1200,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 6, [Action.DOUBLE_DOWN], 1000);

    expect(record.doubleOccurred).toBe(true);
    expect(record.bet).toBe(200);
  });

  it('detects insurance taken', () => {
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('9')],
        bet: 100,
        result: Result.PLAYER_WIN,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('A', 'S'), card('7', 'D')],
      shoe: new Array(300).fill(card('2')),
      chips: 1050,
      insuranceBet: 50,
    });

    const record = buildHandRecord(state, 0, 7, [Action.INSURANCE, Action.STAND], 1000);

    expect(record.insuranceTaken).toBe(true);
  });

  it('computes shoeDepth correctly', () => {
    const totalCards = 6 * 52; // 312
    const shoeLength = 200;
    const state = makeSettledState({
      hands: [{
        cards: [card('K'), card('9')],
        bet: 100,
        result: Result.PLAYER_WIN,
        isDoubled: false,
        isSurrendered: false,
        fromSplit: false,
      }],
      dealerHand: [card('8', 'S'), card('7', 'D')],
      shoe: new Array(shoeLength).fill(card('2')),
      chips: 1100,
      insuranceBet: 0,
    });

    const record = buildHandRecord(state, 0, 8, [Action.STAND], 1000);

    const expectedDepth = (totalCards - shoeLength) / totalCards;
    expect(record.shoeDepth).toBeCloseTo(expectedDepth);
  });
});

describe('deriveSessionStats', () => {
  it('computes stats from multiple hand records', () => {
    const records: HandRecord[] = [
      {
        id: 1,
        timestamp: 1000,
        playerCards: [card('K'), card('9')],
        dealerCards: [card('K', 'S'), card('7', 'D')],
        dealerUpcard: card('K', 'S'),
        playerFinalValue: 19,
        dealerFinalValue: 17,
        bet: 100,
        payout: 100,
        result: Result.PLAYER_WIN,
        actionsSequence: [Action.STAND],
        wasOptimalPlay: true,
        optimalAction: Action.STAND,
        actualAction: Action.STAND,
        chipsBefore: 1000,
        chipsAfter: 1100,
        shoeDepth: 0.1,
        handType: 'hard',
        splitOccurred: false,
        doubleOccurred: false,
        surrenderOccurred: false,
        insuranceTaken: false,
        dealerBusted: false,
      },
      {
        id: 2,
        timestamp: 2000,
        playerCards: [card('K'), card('6'), card('Q')],
        dealerCards: [card('8', 'S'), card('J', 'D')],
        dealerUpcard: card('8', 'S'),
        playerFinalValue: 26,
        dealerFinalValue: 18,
        bet: 50,
        payout: -50,
        result: Result.PLAYER_BUST,
        actionsSequence: [Action.HIT],
        wasOptimalPlay: false,
        optimalAction: Action.STAND,
        actualAction: Action.HIT,
        chipsBefore: 1100,
        chipsAfter: 1050,
        shoeDepth: 0.12,
        handType: 'hard',
        splitOccurred: false,
        doubleOccurred: false,
        surrenderOccurred: false,
        insuranceTaken: false,
        dealerBusted: false,
      },
      {
        id: 3,
        timestamp: 3000,
        playerCards: [card('A'), card('K')],
        dealerCards: [card('9', 'S'), card('8', 'D')],
        dealerUpcard: card('9', 'S'),
        playerFinalValue: 21,
        dealerFinalValue: 17,
        bet: 100,
        payout: 150,
        result: Result.PLAYER_BLACKJACK,
        actionsSequence: [],
        wasOptimalPlay: true,
        optimalAction: null,
        actualAction: null,
        chipsBefore: 1050,
        chipsAfter: 1200,
        shoeDepth: 0.15,
        handType: 'soft',
        splitOccurred: false,
        doubleOccurred: false,
        surrenderOccurred: false,
        insuranceTaken: false,
        dealerBusted: false,
      },
    ];

    const stats = deriveSessionStats(records, DEFAULT_CONFIG);

    expect(stats.totalHands).toBe(3);
    expect(stats.wins).toBe(2); // player-win and player-blackjack
    expect(stats.losses).toBe(1); // player-bust
    expect(stats.pushes).toBe(0);
    expect(stats.blackjacks).toBe(1);
    expect(stats.surrenders).toBe(0);
    expect(stats.winRate).toBeCloseTo(2 / 3);
    expect(stats.playerBustRate).toBeCloseTo(1 / 3);
    expect(stats.dealerBustRate).toBe(0);
    expect(stats.netPnL).toBe(200); // 100 + (-50) + 150
    expect(stats.chipHistory).toEqual([1100, 1050, 1200]);
    expect(stats.peakChips).toBe(1200);
    expect(stats.valleyChips).toBe(1000); // chipsBefore of first hand
    expect(stats.averageBet).toBeCloseTo((100 + 50 + 100) / 3);
    expect(stats.optimalPlayRate).toBeCloseTo(2 / 3);
    expect(stats.hitCount).toBe(1);
    expect(stats.standCount).toBe(1);
    expect(stats.doubleCount).toBe(0);
    expect(stats.splitCount).toBe(0);

    // Optimal play by type
    expect(stats.optimalPlayByType.hard.total).toBe(2);
    expect(stats.optimalPlayByType.hard.correct).toBe(1);
    expect(stats.optimalPlayByType.soft.total).toBe(1);
    expect(stats.optimalPlayByType.soft.correct).toBe(1);

    // Upcard win rates
    expect(stats.upcardWinRates['K']).toEqual({ wins: 1, losses: 0, total: 1 });
    expect(stats.upcardWinRates['8']).toEqual({ wins: 0, losses: 1, total: 1 });
    expect(stats.upcardWinRates['9']).toEqual({ wins: 1, losses: 0, total: 1 });
  });

  it('computes streaks correctly', () => {
    const makeRecord = (id: number, result: typeof Result[keyof typeof Result], chipsBefore: number, chipsAfter: number): HandRecord => ({
      id,
      timestamp: id * 1000,
      playerCards: [card('K'), card('9')],
      dealerCards: [card('K', 'S'), card('7', 'D')],
      dealerUpcard: card('K', 'S'),
      playerFinalValue: 19,
      dealerFinalValue: 17,
      bet: 100,
      payout: result === Result.PLAYER_WIN ? 100 : -100,
      result,
      actionsSequence: [Action.STAND],
      wasOptimalPlay: true,
      optimalAction: Action.STAND,
      actualAction: Action.STAND,
      chipsBefore,
      chipsAfter,
      shoeDepth: 0.1,
      handType: 'hard' as const,
      splitOccurred: false,
      doubleOccurred: false,
      surrenderOccurred: false,
      insuranceTaken: false,
      dealerBusted: false,
    });

    const records = [
      makeRecord(1, Result.PLAYER_WIN, 1000, 1100),
      makeRecord(2, Result.PLAYER_WIN, 1100, 1200),
      makeRecord(3, Result.PLAYER_WIN, 1200, 1300),
      makeRecord(4, Result.DEALER_WIN, 1300, 1200),
      makeRecord(5, Result.DEALER_WIN, 1200, 1100),
    ];

    const stats = deriveSessionStats(records, DEFAULT_CONFIG);

    expect(stats.longestWinStreak).toBe(3);
    expect(stats.longestLossStreak).toBe(2);
    expect(stats.currentStreak).toEqual({ type: 'L', count: 2 });
  });

  it('handles surrender in stats', () => {
    const record: HandRecord = {
      id: 1,
      timestamp: 1000,
      playerCards: [card('K'), card('6')],
      dealerCards: [card('K', 'S'), card('7', 'D')],
      dealerUpcard: card('K', 'S'),
      playerFinalValue: 16,
      dealerFinalValue: 17,
      bet: 100,
      payout: -50,
      result: Result.SURRENDER,
      actionsSequence: [Action.SURRENDER],
      wasOptimalPlay: true,
      optimalAction: Action.SURRENDER,
      actualAction: Action.SURRENDER,
      chipsBefore: 1000,
      chipsAfter: 950,
      shoeDepth: 0.1,
      handType: 'hard',
      splitOccurred: false,
      doubleOccurred: false,
      surrenderOccurred: true,
      insuranceTaken: false,
      dealerBusted: false,
    };

    const stats = deriveSessionStats([record], DEFAULT_CONFIG);

    expect(stats.surrenders).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.surrenderCount).toBe(1);
    expect(stats.netPnL).toBe(-50);
  });

  it('returns empty stats for empty history', () => {
    const stats = deriveSessionStats([], DEFAULT_CONFIG);
    expect(stats.totalHands).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.peakChips).toBe(DEFAULT_CONFIG.startingChips);
    expect(stats.valleyChips).toBe(DEFAULT_CONFIG.startingChips);
  });
});

describe('createEmptySessionStats', () => {
  it('returns zeroed-out stats with correct starting values', () => {
    const config = { ...DEFAULT_CONFIG, startingChips: 5000 };
    const stats = createEmptySessionStats(config);

    expect(stats.totalHands).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.losses).toBe(0);
    expect(stats.pushes).toBe(0);
    expect(stats.blackjacks).toBe(0);
    expect(stats.surrenders).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.playerBustRate).toBe(0);
    expect(stats.dealerBustRate).toBe(0);
    expect(stats.netPnL).toBe(0);
    expect(stats.peakChips).toBe(5000);
    expect(stats.valleyChips).toBe(5000);
    expect(stats.averageBet).toBe(0);
    expect(stats.chipHistory).toEqual([]);
    expect(stats.optimalPlayRate).toBe(0);
    expect(stats.optimalPlayByType).toEqual({
      hard: { correct: 0, total: 0 },
      soft: { correct: 0, total: 0 },
      pair: { correct: 0, total: 0 },
    });
    expect(stats.hitCount).toBe(0);
    expect(stats.standCount).toBe(0);
    expect(stats.doubleCount).toBe(0);
    expect(stats.splitCount).toBe(0);
    expect(stats.surrenderCount).toBe(0);
    expect(stats.insuranceCount).toBe(0);
    expect(stats.currentStreak).toEqual({ type: null, count: 0 });
    expect(stats.longestWinStreak).toBe(0);
    expect(stats.longestLossStreak).toBe(0);
    expect(stats.upcardWinRates).toEqual({});
  });
});
