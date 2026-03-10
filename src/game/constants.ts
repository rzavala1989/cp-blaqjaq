export const Phase = {
  BETTING: 'betting',
  DEALING: 'dealing',
  PEEKING: 'peeking',
  PLAYER_TURN: 'player-turn',
  DEALER_TURN: 'dealer-turn',
  RESOLVING: 'resolving',
  SETTLED: 'settled',
} as const;

export type PhaseValue = (typeof Phase)[keyof typeof Phase];

export const Result = {
  PLAYER_BLACKJACK: 'player-blackjack',
  PLAYER_WIN: 'player-win',
  DEALER_WIN: 'dealer-win',
  PUSH: 'push',
  PLAYER_BUST: 'player-bust',
  DEALER_BUST: 'dealer-bust',
  SURRENDER: 'surrender',
} as const;

export type ResultValue = (typeof Result)[keyof typeof Result];

export const Action = {
  PLACE_BET: 'place-bet',
  DEAL: 'deal',
  PEEK: 'peek',
  HIT: 'hit',
  STAND: 'stand',
  DOUBLE_DOWN: 'double-down',
  SPLIT: 'split',
  INSURANCE: 'insurance',
  DECLINE_INSURANCE: 'decline-insurance',
  EVEN_MONEY: 'even-money',
  DECLINE_EVEN_MONEY: 'decline-even-money',
  SURRENDER: 'surrender',
  DEALER_HIT: 'dealer-hit',
  SETTLE: 'settle',
  NEW_ROUND: 'new-round',
  REBUY: 'rebuy',
} as const;

export type ActionValue = (typeof Action)[keyof typeof Action];

export interface GameConfig {
  deckCount: number;
  reshuffleThreshold: number;
  dealerHitsSoft17: boolean;
  blackjackPayout: number;
  insurancePayout: number;
  startingChips: number;
  minimumBet: number;
  maximumBet: number;
  maxSplitHands: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  deckCount: 6,
  reshuffleThreshold: 0.75,
  dealerHitsSoft17: true,
  blackjackPayout: 1.5,
  insurancePayout: 2,
  startingChips: 1000,
  minimumBet: 10,
  maximumBet: 500,
  maxSplitHands: 4,
};
