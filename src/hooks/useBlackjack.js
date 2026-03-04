import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { gameReducer, createInitialState, canSplit, canDoubleDown, canSurrender } from '../game/gameEngine.js';
import { Phase, Action } from '../game/constants.js';
import { evaluateHand, evaluateHandFull } from '../game/scoring.js';

export function useBlackjack(config = {}) {
  const [state, dispatch] = useReducer(
    gameReducer,
    config,
    (cfg) => createInitialState(cfg)
  );

  const activeHand = state.hands[state.activeHandIndex] || null;

  const playerEval = useMemo(
    () => (activeHand && activeHand.cards.length > 0 ? evaluateHandFull(activeHand.cards) : null),
    [activeHand]
  );

  const dealerEval = useMemo(
    () => (state.dealerHand.length > 0 ? evaluateHand(state.dealerHand) : null),
    [state.dealerHand]
  );

  const dealerFullEval = useMemo(
    () => (state.dealerHand.length > 0 ? evaluateHandFull(state.dealerHand) : null),
    [state.dealerHand]
  );

  // Auto-advance dealer turn with delays
  useEffect(() => {
    if (state.phase === Phase.DEALER_TURN) {
      const timer = setTimeout(() => {
        dispatch({ type: Action.DEALER_HIT });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.dealerHand.length]);

  // Auto-settle after dealer is done
  useEffect(() => {
    if (state.phase === Phase.RESOLVING) {
      const timer = setTimeout(() => {
        dispatch({ type: Action.SETTLE });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // Actions
  const placeBet = useCallback((amount) => {
    dispatch({ type: Action.PLACE_BET, payload: amount });
  }, []);

  const deal = useCallback(() => {
    dispatch({ type: Action.DEAL });
  }, []);

  const hit = useCallback(() => {
    dispatch({ type: Action.HIT });
  }, []);

  const stand = useCallback(() => {
    dispatch({ type: Action.STAND });
  }, []);

  const doubleDown = useCallback(() => {
    dispatch({ type: Action.DOUBLE_DOWN });
  }, []);

  const split = useCallback(() => {
    dispatch({ type: Action.SPLIT });
  }, []);

  const insurance = useCallback(() => {
    dispatch({ type: Action.INSURANCE });
  }, []);

  const declineInsurance = useCallback(() => {
    dispatch({ type: Action.DECLINE_INSURANCE });
  }, []);

  const surrender = useCallback(() => {
    dispatch({ type: Action.SURRENDER });
  }, []);

  const newRound = useCallback(() => {
    dispatch({ type: Action.NEW_ROUND });
  }, []);

  // UI flags
  const isPlayerTurn = state.phase === Phase.PLAYER_TURN;
  const handActive = isPlayerTurn && activeHand && activeHand.result === null;
  const showInsurance = state.insuranceOffered && !state.insuranceDecided;

  return {
    // State
    ...state,
    activeHand,
    playerEval,
    dealerEval,
    dealerFullEval,

    // Actions
    placeBet,
    deal,
    hit,
    stand,
    doubleDown,
    split,
    insurance,
    declineInsurance,
    surrender,
    newRound,

    // UI flags
    canHit: handActive && !showInsurance,
    canStand: handActive && !showInsurance,
    canDouble: handActive && !showInsurance && activeHand && canDoubleDown(activeHand, state.chips),
    canSplitHand: handActive && !showInsurance && activeHand && canSplit(activeHand, state.chips),
    canSurrenderHand: handActive && !showInsurance && activeHand && canSurrender(activeHand),
    showInsurance,
  };
}
