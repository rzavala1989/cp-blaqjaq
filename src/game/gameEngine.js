import { Phase, Result, Action, DEFAULT_CONFIG } from './constants.js';
import { evaluateHandFull } from './scoring.js';
import { createShoe, drawCard, needsReshuffle } from './deck.js';

function createEmptyHand() {
  return {
    cards: [],
    bet: 0,
    result: null,
    isDoubled: false,
    isSurrendered: false,
    fromSplit: false,
  };
}

export function createInitialState(config = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    shoe: createShoe(mergedConfig.deckCount),
    config: mergedConfig,
    phase: Phase.BETTING,
    hands: [createEmptyHand()],
    activeHandIndex: 0,
    dealerHand: [],
    insuranceBet: 0,
    insuranceOffered: false,
    insuranceDecided: false,
    evenMoneyOffered: false,
    evenMoneyDecided: false,
    chips: mergedConfig.startingChips,
    stats: { wins: 0, losses: 0, pushes: 0, blackjacks: 0 },
  };
}

// --- Internal helpers ---

function draw(shoe) {
  const [card, remaining] = drawCard(shoe);
  return [card, remaining];
}

function drawFaceDown(shoe) {
  const [card, remaining] = drawCard(shoe);
  return [{ ...card, faceDown: true }, remaining];
}

function dealerMustHit(dealerHand, config) {
  const { value, isSoft } = evaluateHandFull(dealerHand);
  if (value < 17) return true;
  if (value === 17 && isSoft && config.dealerHitsSoft17) return true;
  return false;
}

function revealDealerHand(dealerHand) {
  return dealerHand.map((card) => ({ ...card, faceDown: false }));
}

function advanceHand(state) {
  const nextIndex = state.activeHandIndex + 1;

  if (nextIndex < state.hands.length) {
    const nextHand = state.hands[nextIndex];
    if (nextHand.result === null) {
      return { ...state, activeHandIndex: nextIndex };
    }
    // If next hand already has a result (e.g. split aces auto-stood),
    // try the one after that
    return advanceHand({ ...state, activeHandIndex: nextIndex });
  }

  // All hands played. Check if all hands busted/surrendered.
  const allHandsDone = state.hands.every(
    (h) => h.result === Result.PLAYER_BUST || h.result === Result.SURRENDER
  );

  if (allHandsDone) {
    return { ...state, phase: Phase.RESOLVING };
  }

  // Reveal dealer cards and start dealer turn
  return {
    ...state,
    dealerHand: revealDealerHand(state.dealerHand),
    phase: Phase.DEALER_TURN,
  };
}

// --- Action handlers ---

function handlePlaceBet(state, amount) {
  if (state.phase !== Phase.BETTING) {
    throw new Error(`Cannot place bet during ${state.phase}`);
  }
  if (amount < state.config.minimumBet) {
    throw new Error(`Bet must be at least ${state.config.minimumBet}`);
  }
  if (amount > state.config.maximumBet) {
    throw new Error(`Bet cannot exceed ${state.config.maximumBet}`);
  }
  if (amount > state.chips) {
    throw new Error('Insufficient chips');
  }

  const hands = [{ ...createEmptyHand(), bet: amount }];
  return {
    ...state,
    chips: state.chips - amount,
    hands,
    phase: Phase.DEALING,
  };
}

function handleDeal(state) {
  if (state.phase !== Phase.DEALING) {
    throw new Error(`Cannot deal during ${state.phase}`);
  }

  let shoe = state.shoe;

  // Deal: player, dealer, player, dealer(faceDown)
  let playerCard1, playerCard2, dealerCard1, dealerCard2;
  [playerCard1, shoe] = draw(shoe);
  [dealerCard1, shoe] = draw(shoe);
  [playerCard2, shoe] = draw(shoe);
  [dealerCard2, shoe] = drawFaceDown(shoe);

  const playerCards = [playerCard1, playerCard2];
  const dealerCards = [dealerCard1, dealerCard2];

  const playerEval = evaluateHandFull(playerCards);
  const dealerEval = evaluateHandFull(dealerCards);

  const hands = [{ ...state.hands[0], cards: playerCards }];

  let newState = {
    ...state,
    shoe,
    hands,
    dealerHand: dealerCards,
    activeHandIndex: 0,
  };

  // Check for naturals
  if (playerEval.isBlackjack && dealerCard1.rank === 'A') {
    // Player has blackjack, dealer shows Ace: offer even money
    newState.evenMoneyOffered = true;
    newState.evenMoneyDecided = false;
    newState.phase = Phase.PLAYER_TURN;
    return newState;
  }

  if (playerEval.isBlackjack && dealerEval.isBlackjack) {
    // Both have blackjack: push
    newState.hands = [{ ...hands[0], result: Result.PUSH }];
    newState.dealerHand = revealDealerHand(dealerCards);
    newState.chips = newState.chips + hands[0].bet;
    newState.stats = { ...newState.stats, pushes: newState.stats.pushes + 1 };
    newState.phase = Phase.SETTLED;
    return newState;
  }

  if (playerEval.isBlackjack) {
    // Player blackjack, dealer does not show Ace
    const payout = hands[0].bet + hands[0].bet * state.config.blackjackPayout;
    newState.hands = [{ ...hands[0], result: Result.PLAYER_BLACKJACK }];
    newState.dealerHand = revealDealerHand(dealerCards);
    newState.chips = newState.chips + payout;
    newState.stats = {
      ...newState.stats,
      blackjacks: newState.stats.blackjacks + 1,
      wins: newState.stats.wins + 1,
    };
    newState.phase = Phase.SETTLED;
    return newState;
  }

  // Check if dealer shows Ace (offer insurance)
  if (dealerCard1.rank === 'A') {
    newState.insuranceOffered = true;
    newState.insuranceDecided = false;
    newState.phase = Phase.PLAYER_TURN;
    return newState;
  }

  // Check if dealer has blackjack (when showing 10-value card)
  if (dealerEval.isBlackjack) {
    newState.hands = [{ ...hands[0], result: Result.DEALER_WIN }];
    newState.dealerHand = revealDealerHand(dealerCards);
    newState.stats = { ...newState.stats, losses: newState.stats.losses + 1 };
    newState.phase = Phase.SETTLED;
    return newState;
  }

  newState.phase = Phase.PLAYER_TURN;
  return newState;
}

function handleHit(state) {
  if (state.phase !== Phase.PLAYER_TURN) {
    throw new Error(`Cannot hit during ${state.phase}`);
  }

  const hand = state.hands[state.activeHandIndex];
  if (hand.result !== null) {
    throw new Error('Hand already has a result');
  }

  let shoe = state.shoe;
  let card;
  [card, shoe] = draw(shoe);

  const newCards = [...hand.cards, card];
  const eval_ = evaluateHandFull(newCards);

  const updatedHand = { ...hand, cards: newCards };
  const newHands = [...state.hands];
  newHands[state.activeHandIndex] = updatedHand;

  let newState = { ...state, shoe, hands: newHands };

  if (eval_.isBust) {
    newHands[state.activeHandIndex] = { ...updatedHand, result: Result.PLAYER_BUST };
    newState.hands = newHands;
    newState.stats = { ...newState.stats, losses: newState.stats.losses + 1 };
    return advanceHand(newState);
  }

  if (eval_.value === 21) {
    // Auto-stand on 21
    return advanceHand(newState);
  }

  return newState;
}

function handleStand(state) {
  if (state.phase !== Phase.PLAYER_TURN) {
    throw new Error(`Cannot stand during ${state.phase}`);
  }
  return advanceHand(state);
}

function handleDoubleDown(state) {
  if (state.phase !== Phase.PLAYER_TURN) {
    throw new Error(`Cannot double down during ${state.phase}`);
  }

  const hand = state.hands[state.activeHandIndex];
  if (hand.cards.length !== 2) {
    throw new Error('Can only double down on initial two cards');
  }
  if (state.chips < hand.bet) {
    throw new Error('Insufficient chips to double down');
  }

  let shoe = state.shoe;
  let card;
  [card, shoe] = draw(shoe);

  const newCards = [...hand.cards, card];
  const eval_ = evaluateHandFull(newCards);

  const updatedHand = {
    ...hand,
    cards: newCards,
    bet: hand.bet * 2,
    isDoubled: true,
  };

  const newHands = [...state.hands];
  newHands[state.activeHandIndex] = updatedHand;

  let newState = {
    ...state,
    shoe,
    hands: newHands,
    chips: state.chips - hand.bet,
  };

  if (eval_.isBust) {
    newHands[state.activeHandIndex] = { ...updatedHand, result: Result.PLAYER_BUST };
    newState.hands = newHands;
    newState.stats = { ...newState.stats, losses: newState.stats.losses + 1 };
  }

  // Always advance after double down (one card only)
  return advanceHand(newState);
}

function handleSplit(state) {
  if (state.phase !== Phase.PLAYER_TURN) {
    throw new Error(`Cannot split during ${state.phase}`);
  }

  const hand = state.hands[state.activeHandIndex];
  if (!canSplit(hand, state.chips, state.hands.length, state.config.maxSplitHands)) {
    throw new Error('Cannot split this hand');
  }

  let shoe = state.shoe;
  let card1, card2;
  [card1, shoe] = draw(shoe);
  [card2, shoe] = draw(shoe);

  const isAces = hand.cards[0].rank === 'A';

  const hand1 = {
    ...createEmptyHand(),
    cards: [hand.cards[0], card1],
    bet: hand.bet,
    fromSplit: true,
  };

  const hand2 = {
    ...createEmptyHand(),
    cards: [hand.cards[1], card2],
    bet: hand.bet,
    fromSplit: true,
  };

  // Split aces: one card each, auto-stand
  if (isAces) {
    // Check if either hand hit 21 (not counted as blackjack from split)
    const eval1 = evaluateHandFull(hand1.cards);
    const eval2 = evaluateHandFull(hand2.cards);

    // No result set for 21 from split, they just auto-stand
    // But bust is still possible (not really with aces, but for correctness)
    if (eval1.isBust) hand1.result = Result.PLAYER_BUST;
    if (eval2.isBust) hand2.result = Result.PLAYER_BUST;
  }

  const newHands = [...state.hands];
  newHands.splice(state.activeHandIndex, 1, hand1, hand2);

  let newState = {
    ...state,
    shoe,
    hands: newHands,
    chips: state.chips - hand.bet,
  };

  if (isAces) {
    // All split ace hands auto-stand, go to dealer
    const allDone = newState.hands.every(
      (h) => h.result === Result.PLAYER_BUST || h.result === Result.SURRENDER || h.fromSplit
    );
    if (allDone && newState.hands.some((h) => h.result === null)) {
      return {
        ...newState,
        dealerHand: revealDealerHand(newState.dealerHand),
        phase: Phase.DEALER_TURN,
      };
    }
    return { ...newState, phase: Phase.RESOLVING };
  }

  return newState;
}

function handleInsurance(state) {
  if (!state.insuranceOffered || state.insuranceDecided) {
    throw new Error('Insurance not available');
  }

  const insuranceBet = Math.floor(state.hands[0].bet / 2);
  if (state.chips < insuranceBet) {
    throw new Error('Insufficient chips for insurance');
  }

  const dealerEval = evaluateHandFull(state.dealerHand);

  let newState = {
    ...state,
    insuranceBet,
    insuranceDecided: true,
    chips: state.chips - insuranceBet,
  };

  if (dealerEval.isBlackjack) {
    // Insurance pays out
    const insurancePayout = insuranceBet + insuranceBet * state.config.insurancePayout;
    newState.chips += insurancePayout;

    // Check player blackjack
    const playerEval = evaluateHandFull(state.hands[0].cards);
    if (playerEval.isBlackjack) {
      // Push on main bet
      newState.hands = [{ ...state.hands[0], result: Result.PUSH }];
      newState.chips += state.hands[0].bet;
      newState.stats = { ...newState.stats, pushes: newState.stats.pushes + 1 };
    } else {
      newState.hands = [{ ...state.hands[0], result: Result.DEALER_WIN }];
      newState.stats = { ...newState.stats, losses: newState.stats.losses + 1 };
    }
    newState.dealerHand = revealDealerHand(state.dealerHand);
    newState.phase = Phase.SETTLED;
    return newState;
  }

  // Dealer does not have blackjack, insurance bet lost, continue playing
  return { ...newState, phase: Phase.PLAYER_TURN };
}

function handleDeclineInsurance(state) {
  if (!state.insuranceOffered || state.insuranceDecided) {
    throw new Error('Insurance not available');
  }

  const dealerEval = evaluateHandFull(state.dealerHand);

  let newState = {
    ...state,
    insuranceDecided: true,
  };

  if (dealerEval.isBlackjack) {
    const playerEval = evaluateHandFull(state.hands[0].cards);
    if (playerEval.isBlackjack) {
      newState.hands = [{ ...state.hands[0], result: Result.PUSH }];
      newState.chips += state.hands[0].bet;
      newState.stats = { ...newState.stats, pushes: newState.stats.pushes + 1 };
    } else {
      newState.hands = [{ ...state.hands[0], result: Result.DEALER_WIN }];
      newState.stats = { ...newState.stats, losses: newState.stats.losses + 1 };
    }
    newState.dealerHand = revealDealerHand(state.dealerHand);
    newState.phase = Phase.SETTLED;
    return newState;
  }

  return { ...newState, phase: Phase.PLAYER_TURN };
}

function handleEvenMoney(state) {
  if (!state.evenMoneyOffered || state.evenMoneyDecided) {
    throw new Error('Even money not available');
  }

  // Pay 1:1 immediately (guaranteed win, no risk of push)
  const bet = state.hands[0].bet;
  return {
    ...state,
    evenMoneyDecided: true,
    hands: [{ ...state.hands[0], result: Result.PLAYER_BLACKJACK }],
    dealerHand: revealDealerHand(state.dealerHand),
    chips: state.chips + bet * 2,
    stats: {
      ...state.stats,
      blackjacks: state.stats.blackjacks + 1,
      wins: state.stats.wins + 1,
    },
    phase: Phase.SETTLED,
  };
}

function handleDeclineEvenMoney(state) {
  if (!state.evenMoneyOffered || state.evenMoneyDecided) {
    throw new Error('Even money not available');
  }

  const dealerEval = evaluateHandFull(state.dealerHand);

  let newState = {
    ...state,
    evenMoneyDecided: true,
  };

  if (dealerEval.isBlackjack) {
    // Both have blackjack: push
    newState.hands = [{ ...state.hands[0], result: Result.PUSH }];
    newState.dealerHand = revealDealerHand(state.dealerHand);
    newState.chips = newState.chips + state.hands[0].bet;
    newState.stats = { ...newState.stats, pushes: newState.stats.pushes + 1 };
    newState.phase = Phase.SETTLED;
    return newState;
  }

  // Dealer doesn't have blackjack: player gets full 3:2
  const payout = state.hands[0].bet + state.hands[0].bet * state.config.blackjackPayout;
  newState.hands = [{ ...state.hands[0], result: Result.PLAYER_BLACKJACK }];
  newState.dealerHand = revealDealerHand(state.dealerHand);
  newState.chips = newState.chips + payout;
  newState.stats = {
    ...newState.stats,
    blackjacks: newState.stats.blackjacks + 1,
    wins: newState.stats.wins + 1,
  };
  newState.phase = Phase.SETTLED;
  return newState;
}

function handleSurrender(state) {
  if (state.phase !== Phase.PLAYER_TURN) {
    throw new Error(`Cannot surrender during ${state.phase}`);
  }

  const hand = state.hands[state.activeHandIndex];
  if (hand.cards.length !== 2) {
    throw new Error('Can only surrender on initial two cards');
  }
  if (hand.fromSplit) {
    throw new Error('Cannot surrender a split hand');
  }

  const halfBet = Math.floor(hand.bet / 2);
  const updatedHand = { ...hand, result: Result.SURRENDER, isSurrendered: true };

  const newHands = [...state.hands];
  newHands[state.activeHandIndex] = updatedHand;

  return {
    ...state,
    hands: newHands,
    chips: state.chips + halfBet,
    stats: { ...state.stats, losses: state.stats.losses + 1 },
    phase: Phase.SETTLED,
  };
}

function handleDealerHit(state) {
  if (state.phase !== Phase.DEALER_TURN) {
    throw new Error(`Dealer cannot hit during ${state.phase}`);
  }

  const dealerEval = evaluateHandFull(state.dealerHand);

  // Check if dealer should stand
  if (!dealerMustHit(state.dealerHand, state.config) || dealerEval.isBust) {
    return { ...state, phase: Phase.RESOLVING };
  }

  // Dealer draws a card
  let shoe = state.shoe;
  let card;
  [card, shoe] = draw(shoe);

  const newDealerHand = [...state.dealerHand, card];
  const newEval = evaluateHandFull(newDealerHand);

  let newState = {
    ...state,
    shoe,
    dealerHand: newDealerHand,
  };

  // Check if dealer should stop after this card
  if (newEval.isBust || !dealerMustHit(newDealerHand, state.config)) {
    newState.phase = Phase.RESOLVING;
  }

  return newState;
}

function handleSettle(state) {
  if (state.phase !== Phase.RESOLVING) {
    throw new Error(`Cannot settle during ${state.phase}`);
  }

  const dealerEval = evaluateHandFull(state.dealerHand);
  const dealerBust = dealerEval.isBust;

  let chips = state.chips;
  let stats = { ...state.stats };
  const settledHands = state.hands.map((hand) => {
    // Already resolved (bust, surrender)
    if (hand.result !== null) return hand;

    const playerEval = evaluateHandFull(hand.cards);

    if (dealerBust) {
      chips += hand.bet * 2;
      stats.wins++;
      return { ...hand, result: Result.DEALER_BUST };
    }

    if (playerEval.value > dealerEval.value) {
      chips += hand.bet * 2;
      stats.wins++;
      return { ...hand, result: Result.PLAYER_WIN };
    }

    if (playerEval.value < dealerEval.value) {
      stats.losses++;
      return { ...hand, result: Result.DEALER_WIN };
    }

    // Equal value: push
    chips += hand.bet;
    stats.pushes++;
    return { ...hand, result: Result.PUSH };
  });

  return {
    ...state,
    hands: settledHands,
    chips,
    stats,
    phase: Phase.SETTLED,
  };
}

function handleNewRound(state) {
  if (state.phase !== Phase.SETTLED) {
    throw new Error(`Cannot start new round during ${state.phase}`);
  }

  let shoe = state.shoe;
  if (needsReshuffle(shoe, state.config.deckCount, state.config.reshuffleThreshold)) {
    shoe = createShoe(state.config.deckCount);
  }

  return {
    ...state,
    shoe,
    phase: Phase.BETTING,
    hands: [createEmptyHand()],
    activeHandIndex: 0,
    dealerHand: [],
    insuranceBet: 0,
    insuranceOffered: false,
    insuranceDecided: false,
    evenMoneyOffered: false,
    evenMoneyDecided: false,
  };
}

function handleRebuy(state) {
  if (state.phase !== Phase.SETTLED) {
    throw new Error(`Cannot rebuy during ${state.phase}`);
  }
  if (state.chips >= state.config.minimumBet) {
    throw new Error('Cannot rebuy when you still have chips to play');
  }

  return {
    ...state,
    chips: state.config.startingChips,
  };
}

// --- Main reducer ---

export function gameReducer(state, action) {
  switch (action.type) {
    case Action.PLACE_BET:
      return handlePlaceBet(state, action.payload);
    case Action.DEAL:
      return handleDeal(state);
    case Action.HIT:
      return handleHit(state);
    case Action.STAND:
      return handleStand(state);
    case Action.DOUBLE_DOWN:
      return handleDoubleDown(state);
    case Action.SPLIT:
      return handleSplit(state);
    case Action.INSURANCE:
      return handleInsurance(state);
    case Action.DECLINE_INSURANCE:
      return handleDeclineInsurance(state);
    case Action.EVEN_MONEY:
      return handleEvenMoney(state);
    case Action.DECLINE_EVEN_MONEY:
      return handleDeclineEvenMoney(state);
    case Action.SURRENDER:
      return handleSurrender(state);
    case Action.DEALER_HIT:
      return handleDealerHit(state);
    case Action.SETTLE:
      return handleSettle(state);
    case Action.NEW_ROUND:
      return handleNewRound(state);
    case Action.REBUY:
      return handleRebuy(state);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// --- Exported helpers for UI ---

export function canSplit(hand, chips, totalHands = 1, maxSplitHands = 4) {
  if (hand.cards.length !== 2) return false;
  if (totalHands >= maxSplitHands) return false;
  const rank1 = hand.cards[0].rank;
  const rank2 = hand.cards[1].rank;
  const val1 = ['10', 'J', 'Q', 'K'].includes(rank1) ? '10' : rank1;
  const val2 = ['10', 'J', 'Q', 'K'].includes(rank2) ? '10' : rank2;
  return val1 === val2 && chips >= hand.bet;
}

export function canDoubleDown(hand, chips) {
  return hand.cards.length === 2 && chips >= hand.bet;
}

export function canSurrender(hand) {
  return hand.cards.length === 2 && !hand.fromSplit;
}

export function isBankrupt(chips, minimumBet) {
  return chips < minimumBet;
}
