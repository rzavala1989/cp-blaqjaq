import type { useBlackjack } from '../hooks/useBlackjack';
import { evaluateHandFull } from '../game/scoring';
import { Phase } from '../game/constants';
import {
  HUDPanel, HUDSection, HUDRow, HUDLabel, HUDCard,
  HUDScore, HUDResultTag, HUDDivider, HUDChips, HUDBet,
} from '../styled/styled-components';

type Game = ReturnType<typeof useBlackjack>;

const SUIT_SYMBOL: Record<string, string> = { H: '♥', D: '♦', S: '♠', C: '♣' };
const RED_SUITS = new Set(['H', 'D']);

function formatScore(eval_: { value: number; isSoft: boolean; isBlackjack: boolean; isBust: boolean } | null): string {
  if (!eval_ || eval_.value === 0) return '';
  if (eval_.isBlackjack) return 'BJ';
  if (eval_.isBust) return 'BUST';
  if (eval_.isSoft && eval_.value !== 21) return `${eval_.value - 10}/${eval_.value}`;
  return String(eval_.value);
}

const RESULT_LABEL: Record<string, string> = {
  'player-blackjack': 'Blackjack',
  'player-win':       'Win',
  'dealer-win':       'Lose',
  'push':             'Push',
  'player-bust':      'Bust',
  'dealer-bust':      'Win',
  'surrender':        'Surrender',
};

const RESULT_COLOR: Record<string, string> = {
  'player-blackjack': '#ffd700',
  'player-win':       '#5aaa6a',
  'dealer-win':       '#cc5555',
  'push':             '#9a9a7a',
  'player-bust':      '#cc5555',
  'dealer-bust':      '#5aaa6a',
  'surrender':        '#b08a2a',
};

interface GameHUDProps {
  game: Game;
  dealtReady: boolean;
}

export function GameHUD({ game, dealtReady }: GameHUDProps) {
  const hasDealerCards = game.dealerHand.length > 0;
  const hasPlayerCards = (game.hands[0]?.cards.length ?? 0) > 0;
  const dealerScore = formatScore(game.dealerEval);
  const isPlayerTurn = game.phase === Phase.PLAYER_TURN;
  const bet = game.hands[0]?.bet ?? 0;

  return (
    <HUDPanel>
      {hasDealerCards && (
        <HUDSection>
          <HUDRow>
            <HUDLabel>Dealer</HUDLabel>
            {dealerScore && <HUDScore>{dealerScore}</HUDScore>}
          </HUDRow>
          <HUDRow>
            {game.dealerHand.map((card, i) =>
              card.faceDown ? (
                <HUDCard key={i} $faceDown>?</HUDCard>
              ) : (
                <HUDCard key={i} $red={RED_SUITS.has(card.suit)}>
                  {card.rank}{SUIT_SYMBOL[card.suit] ?? card.suit}
                </HUDCard>
              )
            )}
          </HUDRow>
        </HUDSection>
      )}

      {hasDealerCards && hasPlayerCards && <HUDDivider />}

      {hasPlayerCards && game.hands.map((hand, i) => {
        const eval_ = hand.cards.length > 0 ? evaluateHandFull(hand.cards) : null;
        const score = formatScore(eval_);
        const isActive = isPlayerTurn && i === game.activeHandIndex;

        return (
          <HUDSection key={i} $active={isActive}>
            <HUDRow>
              <HUDLabel>{game.hands.length > 1 ? `Hand ${i + 1}` : 'You'}</HUDLabel>
              {score && <HUDScore>{score}</HUDScore>}
              {hand.result && dealtReady && (
                <HUDResultTag $color={RESULT_COLOR[hand.result]}>
                  {RESULT_LABEL[hand.result] ?? hand.result}
                </HUDResultTag>
              )}
            </HUDRow>
            <HUDRow>
              {hand.cards.map((card, j) => (
                <HUDCard key={j} $red={RED_SUITS.has(card.suit)}>
                  {card.rank}{SUIT_SYMBOL[card.suit] ?? card.suit}
                </HUDCard>
              ))}
            </HUDRow>
          </HUDSection>
        );
      })}

      <HUDDivider />

      <HUDRow>
        <HUDChips>◆ {game.chips.toLocaleString()}</HUDChips>
        {bet > 0 && <HUDBet>BET {bet}</HUDBet>}
      </HUDRow>
    </HUDPanel>
  );
}
