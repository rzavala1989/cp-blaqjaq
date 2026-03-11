import type { Card } from './deck';
import type { GameState } from './gameEngine';
import type { ActionValue, GameConfig, ResultValue } from './constants';
import { Result } from './constants';
import { evaluateHandFull } from './scoring';
import { getOptimalAction, isOptimalPlay, getHandType, getUpcardValue } from './basicStrategy';

export interface HandRecord {
  id: number;
  timestamp: number;
  playerCards: Card[];
  dealerCards: Card[];
  dealerUpcard: Card;
  playerFinalValue: number;
  dealerFinalValue: number;
  bet: number;
  payout: number;
  result: ResultValue;
  actionsSequence: ActionValue[];
  wasOptimalPlay: boolean;
  optimalAction: ActionValue | null;
  actualAction: ActionValue | null;
  chipsBefore: number;
  chipsAfter: number;
  shoeDepth: number;
  handType: 'hard' | 'soft' | 'pair';
  splitOccurred: boolean;
  doubleOccurred: boolean;
  surrenderOccurred: boolean;
  insuranceTaken: boolean;
  dealerBusted: boolean;
}

export interface SessionStats {
  totalHands: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  surrenders: number;
  winRate: number;
  playerBustRate: number;
  dealerBustRate: number;
  netPnL: number;
  peakChips: number;
  valleyChips: number;
  averageBet: number;
  chipHistory: number[];
  optimalPlayRate: number;
  optimalPlayByType: {
    hard: { correct: number; total: number };
    soft: { correct: number; total: number };
    pair: { correct: number; total: number };
  };
  hitCount: number;
  standCount: number;
  doubleCount: number;
  splitCount: number;
  surrenderCount: number;
  insuranceCount: number;
  currentStreak: { type: 'W' | 'L' | null; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  upcardWinRates: Record<string, { wins: number; losses: number; total: number }>;
}

function computePayout(result: ResultValue, bet: number, blackjackPayout: number): number {
  switch (result) {
    case Result.PLAYER_WIN:
    case Result.DEALER_BUST:
      return bet;
    case Result.PLAYER_BLACKJACK:
      return bet * blackjackPayout;
    case Result.DEALER_WIN:
    case Result.PLAYER_BUST:
      return -bet;
    case Result.PUSH:
      return 0;
    case Result.SURRENDER:
      return -Math.floor(bet / 2);
    default:
      return 0;
  }
}

function canSplitCheck(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return getUpcardValue(cards[0]) === getUpcardValue(cards[1]);
}

export function buildHandRecord(
  state: GameState,
  handIndex: number,
  handId: number,
  actionsSequence: ActionValue[],
  chipsBefore: number,
): HandRecord {
  const hand = state.hands[handIndex];
  const playerCards = hand.cards;
  const dealerCards = state.dealerHand;
  const dealerUpcard = dealerCards[0];

  const playerEval = evaluateHandFull(playerCards);
  const dealerEval = evaluateHandFull(dealerCards);

  const result = hand.result!;
  const bet = hand.bet;
  const payout = computePayout(result, bet, state.config.blackjackPayout);

  const totalCards = state.config.deckCount * 52;
  const shoeDepth = (totalCards - state.shoe.length) / totalCards;

  const initialCards = playerCards.slice(0, 2);
  const firstAction = actionsSequence[0] ?? null;
  const canDouble = initialCards.length === 2;
  const canSplitHand = canSplitCheck(initialCards);
  const canSurrender = initialCards.length === 2 && !hand.fromSplit;

  let optimalAction: ActionValue | null = null;
  let wasOptimal = false;

  if (initialCards.length >= 2) {
    optimalAction = getOptimalAction(
      initialCards,
      dealerUpcard,
      canDouble,
      canSplitHand,
      canSurrender,
    );

    if (firstAction !== null) {
      wasOptimal = isOptimalPlay(
        initialCards,
        dealerUpcard,
        firstAction,
        canDouble,
        canSplitHand,
        canSurrender,
      );
    }
  }

  const handType = initialCards.length >= 2 ? getHandType(initialCards) : 'hard';

  return {
    id: handId,
    timestamp: Date.now(),
    playerCards,
    dealerCards,
    dealerUpcard,
    playerFinalValue: playerEval.value,
    dealerFinalValue: dealerEval.value,
    bet,
    payout,
    result,
    actionsSequence,
    wasOptimalPlay: wasOptimal,
    optimalAction,
    actualAction: firstAction,
    chipsBefore,
    chipsAfter: state.chips,
    shoeDepth,
    handType,
    splitOccurred: actionsSequence.includes('split' as ActionValue),
    doubleOccurred: hand.isDoubled,
    surrenderOccurred: hand.isSurrendered,
    insuranceTaken: state.insuranceBet > 0,
    dealerBusted: dealerEval.isBust,
  };
}

const WIN_RESULTS: ReadonlySet<ResultValue> = new Set([
  Result.PLAYER_WIN,
  Result.DEALER_BUST,
  Result.PLAYER_BLACKJACK,
]);

const LOSS_RESULTS: ReadonlySet<ResultValue> = new Set([
  Result.DEALER_WIN,
  Result.PLAYER_BUST,
]);

export function deriveSessionStats(history: HandRecord[], config: GameConfig): SessionStats {
  const stats = createEmptySessionStats(config);

  if (history.length === 0) return stats;

  stats.totalHands = history.length;

  let winStreak = 0;
  let lossStreak = 0;
  let currentType: 'W' | 'L' | null = null;
  let currentCount = 0;

  let totalBets = 0;
  let optimalCount = 0;

  for (const record of history) {
    // Win/loss/push counting
    if (WIN_RESULTS.has(record.result)) {
      stats.wins++;
      winStreak++;
      lossStreak = 0;
      if (currentType === 'W') {
        currentCount++;
      } else {
        currentType = 'W';
        currentCount = 1;
      }
    } else if (LOSS_RESULTS.has(record.result)) {
      stats.losses++;
      lossStreak++;
      winStreak = 0;
      if (currentType === 'L') {
        currentCount++;
      } else {
        currentType = 'L';
        currentCount = 1;
      }
    } else if (record.result === Result.PUSH) {
      stats.pushes++;
      // Pushes don't affect streaks direction, but reset current run
      winStreak = 0;
      lossStreak = 0;
      currentType = null;
      currentCount = 0;
    } else if (record.result === Result.SURRENDER) {
      stats.surrenders++;
      stats.losses++;
      lossStreak++;
      winStreak = 0;
      if (currentType === 'L') {
        currentCount++;
      } else {
        currentType = 'L';
        currentCount = 1;
      }
    }

    if (record.result === Result.PLAYER_BLACKJACK) {
      stats.blackjacks++;
    }

    if (record.result === Result.PLAYER_BUST) {
      stats.playerBustRate++;
    }

    if (record.dealerBusted) {
      stats.dealerBustRate++;
    }

    stats.longestWinStreak = Math.max(stats.longestWinStreak, winStreak);
    stats.longestLossStreak = Math.max(stats.longestLossStreak, lossStreak);

    // PnL
    stats.netPnL += record.payout;

    // Bets
    totalBets += record.bet;

    // Chip history
    stats.chipHistory.push(record.chipsAfter);
    stats.peakChips = Math.max(stats.peakChips, record.chipsAfter);
    stats.valleyChips = Math.min(stats.valleyChips, record.chipsAfter);

    // Optimal play
    if (record.wasOptimalPlay) {
      optimalCount++;
    }

    const ht = record.handType;
    stats.optimalPlayByType[ht].total++;
    if (record.wasOptimalPlay) {
      stats.optimalPlayByType[ht].correct++;
    }

    // Action counts
    for (const action of record.actionsSequence) {
      switch (action) {
        case 'hit': stats.hitCount++; break;
        case 'stand': stats.standCount++; break;
        case 'double-down': stats.doubleCount++; break;
        case 'split': stats.splitCount++; break;
        case 'surrender': stats.surrenderCount++; break;
        case 'insurance': stats.insuranceCount++; break;
      }
    }

    // Upcard win rates
    const upcardRank = record.dealerUpcard.rank;
    if (!stats.upcardWinRates[upcardRank]) {
      stats.upcardWinRates[upcardRank] = { wins: 0, losses: 0, total: 0 };
    }
    stats.upcardWinRates[upcardRank].total++;
    if (WIN_RESULTS.has(record.result)) {
      stats.upcardWinRates[upcardRank].wins++;
    } else if (LOSS_RESULTS.has(record.result) || record.result === Result.SURRENDER) {
      stats.upcardWinRates[upcardRank].losses++;
    }
  }

  // Derived rates
  const decisions = stats.wins + stats.losses;
  stats.winRate = decisions > 0 ? stats.wins / decisions : 0;
  stats.playerBustRate = stats.playerBustRate / stats.totalHands;
  stats.dealerBustRate = stats.dealerBustRate / stats.totalHands;
  stats.averageBet = totalBets / stats.totalHands;
  stats.optimalPlayRate = optimalCount / stats.totalHands;
  stats.currentStreak = { type: currentType, count: currentCount };

  // Peak/valley should also consider chipsBefore of the first hand
  if (history.length > 0) {
    stats.peakChips = Math.max(stats.peakChips, history[0].chipsBefore);
    stats.valleyChips = Math.min(stats.valleyChips, history[0].chipsBefore);
  }

  return stats;
}

export function createEmptySessionStats(config: GameConfig): SessionStats {
  return {
    totalHands: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0,
    surrenders: 0,
    winRate: 0,
    playerBustRate: 0,
    dealerBustRate: 0,
    netPnL: 0,
    peakChips: config.startingChips,
    valleyChips: config.startingChips,
    averageBet: 0,
    chipHistory: [],
    optimalPlayRate: 0,
    optimalPlayByType: {
      hard: { correct: 0, total: 0 },
      soft: { correct: 0, total: 0 },
      pair: { correct: 0, total: 0 },
    },
    hitCount: 0,
    standCount: 0,
    doubleCount: 0,
    splitCount: 0,
    surrenderCount: 0,
    insuranceCount: 0,
    currentStreak: { type: null, count: 0 },
    longestWinStreak: 0,
    longestLossStreak: 0,
    upcardWinRates: {},
  };
}
