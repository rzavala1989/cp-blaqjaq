import type { useBlackjack } from '../hooks/useBlackjack';
import { Phase } from '../game/constants';
import { ControlsPanel, CasinoButton, BarChipCount, BarScoreLeft, BarScoreRight } from '../styled/styled-components';
import { BettingPanel } from './BettingPanel';

type Game = ReturnType<typeof useBlackjack>;

type HandEval = { value: number; isSoft: boolean; isBlackjack: boolean; isBust: boolean } | null;

function formatScore(eval_: HandEval): string {
  if (!eval_ || eval_.value === 0) return '';
  if (eval_.isBlackjack) return 'BJ';
  if (eval_.isBust) return 'BUST';
  if (eval_.isSoft && eval_.value !== 21) return `${eval_.value - 10}/${eval_.value}`;
  return String(eval_.value);
}

interface GameControlsProps {
  game: Game;
  dealtReady: boolean;
  currentBet: number;
  addToBet: (n: number) => void;
  clearBet: () => void;
  onDeal: () => void;
}

export function GameControls({ game, dealtReady, currentBet, addToBet, clearBet, onDeal }: GameControlsProps) {
  const isBetting = game.phase === Phase.BETTING;
  const isSettled = game.phase === Phase.SETTLED;
  const hasDealerCards = game.dealerHand.length > 0;
  const hasPlayerCards = (game.hands[0]?.cards.length ?? 0) > 0;

  const dealerScoreStr = (() => {
    if (!hasDealerCards) return '';
    if (game.phase === Phase.PEEKING && game.dealerHand.some(c => c.faceDown)) return '?';
    return formatScore(game.dealerEval);
  })();

  const playerScoreStr = hasPlayerCards ? formatScore(game.playerEval) : '';

  return (
    <ControlsPanel>
      <BarChipCount>◆ {game.chips.toLocaleString()}</BarChipCount>

      {dealerScoreStr && <BarScoreLeft>DEALER&nbsp;&nbsp;{dealerScoreStr}</BarScoreLeft>}
      {playerScoreStr && <BarScoreRight>YOU&nbsp;&nbsp;{playerScoreStr}</BarScoreRight>}

      {isBetting && (
        <BettingPanel
          game={game}
          currentBet={currentBet}
          addToBet={addToBet}
          clearBet={clearBet}
          onDeal={onDeal}
          dealtReady={dealtReady}
        />
      )}

      {game.showInsurance && (
        <>
          <CasinoButton $variant="gold" onClick={game.insurance} disabled={!dealtReady}>Insurance</CasinoButton>
          <CasinoButton $variant="danger" onClick={game.declineInsurance} disabled={!dealtReady}>No Insurance</CasinoButton>
        </>
      )}

      {game.showEvenMoney && (
        <>
          <CasinoButton $variant="gold" onClick={game.evenMoney} disabled={!dealtReady}>Even Money</CasinoButton>
          <CasinoButton $variant="danger" onClick={game.declineEvenMoney} disabled={!dealtReady}>Decline</CasinoButton>
        </>
      )}

      {game.canHit && (
        <CasinoButton $variant="action" onClick={game.hit} disabled={!dealtReady}>Hit</CasinoButton>
      )}
      {game.canStand && (
        <CasinoButton $variant="action" onClick={game.stand} disabled={!dealtReady}>Stand</CasinoButton>
      )}
      {game.canDouble && (
        <CasinoButton $variant="power" onClick={game.doubleDown} disabled={!dealtReady}>Double</CasinoButton>
      )}
      {game.canSplitHand && (
        <CasinoButton $variant="power" onClick={game.split} disabled={!dealtReady}>Split</CasinoButton>
      )}
      {game.canSurrenderHand && (
        <CasinoButton $variant="danger" onClick={game.surrender} disabled={!dealtReady}>Surrender</CasinoButton>
      )}

      {isSettled && (
        <CasinoButton $variant="deal" onClick={game.newRound} disabled={!dealtReady}>New Round</CasinoButton>
      )}
      {game.bankrupt && (
        <CasinoButton $variant="rebuy" onClick={game.rebuy}>Rebuy</CasinoButton>
      )}
    </ControlsPanel>
  );
}
