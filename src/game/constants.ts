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

// Chip denomination definitions: single source of truth for 3D and UI
export interface ChipDenom {
  value: number;
  color: string;       // solid hex for 3D meshes
  uiColor: string;     // rgba for 2D UI buttons
  label: string;
}

export const PLAYER_DENOMS: ChipDenom[] = [
  { value: 500, color: '#6050a8', uiColor: 'rgba(96, 80, 168, 0.75)',  label: '500' },
  { value: 100, color: '#2a2a2a', uiColor: 'rgba(58, 58, 58, 0.85)',   label: '100' },
  { value: 25,  color: '#1e6b1e', uiColor: 'rgba(30, 107, 30, 0.75)',  label: '25' },
  { value: 10,  color: '#cc2020', uiColor: 'rgba(204, 32, 32, 0.75)',  label: '10' },
];

export const DEALER_DENOMS: ChipDenom[] = [
  { value: 1000, color: '#c8a000', uiColor: '', label: '1000' },
  { value: 500,  color: '#6050a8', uiColor: '', label: '500' },
  { value: 100,  color: '#2a2a2a', uiColor: '', label: '100' },
  { value: 25,   color: '#1e6b1e', uiColor: '', label: '25' },
  { value: 5,    color: '#cc2020', uiColor: '', label: '5' },
  { value: 1,    color: '#1e8fcc', uiColor: '', label: '1' },
];

export const DENOMINATIONS = PLAYER_DENOMS.map(d => d.value);

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
