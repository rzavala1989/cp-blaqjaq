import { useRef } from 'react';
import { useTransition, useSpring, animated } from '@react-spring/web';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useBlackjack } from './hooks/useBlackjack';
import { Hand } from './components/Hand';
import { Values } from './components/Values';
import { AnimatedChipCount } from './components/AnimatedChipCount';
import { Phase, Result } from './game/constants';

import {
  GameBoard,
  PlayerInfo,
  PlayerScore,
  DealerInfo,
  DealerScore,
  HitButton,
  StandButton,
  ActionRow,
  ActionButton,
  NewRoundButton,
  ScreenFlash,
} from './styled/styled-components';

const TRANSITION_CONFIG = { tension: 250, friction: 22 };

function App() {
  const game = useBlackjack();
  const prefersReduced = useReducedMotion();
  const prevPhaseRef = useRef(game.phase);

  const isBetting = game.phase === Phase.BETTING;
  const isSettled = game.phase === Phase.SETTLED;
  const dealerRevealed =
    game.phase === Phase.DEALER_TURN ||
    game.phase === Phase.RESOLVING ||
    isSettled;

  const getDealerResult = () => {
    if (!isSettled) return null;
    const playerResults = game.hands.map((h) => h.result);
    if (playerResults.some((r) => r === Result.DEALER_BUST)) return Result.PLAYER_BUST;
    if (playerResults.every((r) => r === Result.PUSH)) return Result.PUSH;
    if (
      playerResults.some(
        (r) =>
          r === Result.DEALER_WIN ||
          r === Result.PLAYER_BUST ||
          r === Result.SURRENDER
      )
    )
      return Result.PLAYER_WIN;
    return null;
  };

  const handleBetAndDeal = (amount) => {
    game.placeBet(amount);
    game.deal();
  };

  // --- Step 7: Phase transition animations ---

  const showBetting = isBetting && !game.bankrupt;
  const bettingTransition = useTransition(showBetting, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  const bankruptTransition = useTransition(game.bankrupt, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  const evenMoneyTransition = useTransition(game.showEvenMoney, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  const insuranceTransition = useTransition(game.showInsurance, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  const showSpecialActions = game.canDouble || game.canSplitHand || game.canSurrenderHand;
  const specialActionsTransition = useTransition(showSpecialActions, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  const newRoundTransition = useTransition(isSettled, {
    from: { opacity: 0, y: 30, scale: 0.95 },
    enter: { opacity: 1, y: 0, scale: 1 },
    leave: { opacity: 0, y: -20, scale: 0.95 },
    config: TRANSITION_CONFIG,
    immediate: prefersReduced,
  });

  // --- Step 9: Screen flash on settlement ---

  const justSettled = isSettled && prevPhaseRef.current !== Phase.SETTLED;
  if (game.phase !== prevPhaseRef.current) {
    prevPhaseRef.current = game.phase;
  }

  let flashColor = 'transparent';
  if (justSettled && !prefersReduced) {
    const playerResults = game.hands.map((h) => h.result);
    const hasBlackjack = playerResults.some((r) => r === Result.PLAYER_BLACKJACK);
    const hasWin = playerResults.some(
      (r) => r === Result.PLAYER_WIN || r === Result.DEALER_BUST
    );
    const hasLoss = playerResults.some(
      (r) => r === Result.DEALER_WIN || r === Result.PLAYER_BUST
    );
    const hasPush = playerResults.every((r) => r === Result.PUSH);

    if (hasBlackjack) flashColor = 'rgba(255, 215, 0, 0.3)';
    else if (hasWin) flashColor = 'rgba(0, 180, 80, 0.25)';
    else if (hasLoss) flashColor = 'rgba(200, 30, 30, 0.25)';
    else if (hasPush) flashColor = 'rgba(255, 215, 0, 0.15)';
  }

  const flashSpring = useSpring({
    from: { opacity: justSettled && !prefersReduced ? 1 : 0 },
    to: { opacity: 0 },
    config: { duration: 800 },
    reset: justSettled,
    immediate: prefersReduced,
  });

  return (
    <GameBoard>
      <PlayerInfo>
        Player
        <PlayerScore>{game.stats.wins}</PlayerScore>
      </PlayerInfo>
      <DealerInfo>
        Dealer
        <DealerScore>{game.stats.losses}</DealerScore>
      </DealerInfo>

      {/* Step 8: Animated chip count */}
      <AnimatedChipCount value={game.chips} />

      <Hand
        top={true}
        cards={game.dealerHand}
        result={isSettled ? getDealerResult() : null}
      />

      <Values
        dealerHasRevealed={dealerRevealed}
        playerValue={game.playerEval?.value || 0}
        dealerValue={dealerRevealed ? game.dealerFullEval?.value || 0 : game.dealerEval?.value || 0}
      />

      {game.hands.map((hand, i) => (
        <Hand
          key={i}
          top={false}
          cards={hand.cards}
          result={hand.result}
          isActive={game.hands.length > 1 && i === game.activeHandIndex}
        />
      ))}

      {/* Step 7: Animated phase transitions */}

      {bettingTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <ActionRow>
              {[10, 25, 50, 100].map((amt) => (
                <ActionButton
                  key={amt}
                  $large
                  onClick={() => handleBetAndDeal(amt)}
                  disabled={amt > game.chips}
                >
                  ${amt}
                </ActionButton>
              ))}
            </ActionRow>
          </animated.div>
        ) : null
      )}

      {bankruptTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <ActionRow>
              <ActionButton $large onClick={game.rebuy}>
                Rebuy ${game.config.startingChips}
              </ActionButton>
            </ActionRow>
          </animated.div>
        ) : null
      )}

      {evenMoneyTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <ActionRow>
              <ActionButton onClick={game.evenMoney}>Even Money</ActionButton>
              <ActionButton $muted onClick={game.declineEvenMoney}>No Thanks</ActionButton>
            </ActionRow>
          </animated.div>
        ) : null
      )}

      {insuranceTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <ActionRow>
              <ActionButton onClick={game.insurance}>Insurance</ActionButton>
              <ActionButton $muted onClick={game.declineInsurance}>No Insurance</ActionButton>
            </ActionRow>
          </animated.div>
        ) : null
      )}

      {specialActionsTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <ActionRow $compact>
              {game.canDouble && (
                <ActionButton onClick={game.doubleDown}>Double</ActionButton>
              )}
              {game.canSplitHand && (
                <ActionButton onClick={game.split}>Split</ActionButton>
              )}
              {game.canSurrenderHand && (
                <ActionButton $muted onClick={game.surrender}>Surrender</ActionButton>
              )}
            </ActionRow>
          </animated.div>
        ) : null
      )}

      {newRoundTransition((style, show) =>
        show ? (
          <animated.div style={{
            transform: style.y.to((y) => `translateY(${y}px) scale(${style.scale.get()})`),
            opacity: style.opacity,
          }}>
            <NewRoundButton onClick={game.newRound}>New Round</NewRoundButton>
          </animated.div>
        ) : null
      )}

      <HitButton disabled={!game.canHit} onClick={game.hit}>
        Hit
      </HitButton>
      <StandButton disabled={!game.canStand} onClick={game.stand}>
        Stand
      </StandButton>

      {/* Step 9: Screen flash overlay */}
      <ScreenFlash
        style={{
          opacity: flashSpring.opacity,
          background: `radial-gradient(ellipse at 50% 50%, ${flashColor} 0%, transparent 70%)`,
        }}
      />
    </GameBoard>
  );
}

export default App;
