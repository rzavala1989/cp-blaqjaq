import type { useBlackjack } from '../hooks/useBlackjack';
import { Phase } from '../game/constants';
import { ControlsPanel, CasinoButton } from '../styled/styled-components';

type Game = ReturnType<typeof useBlackjack>;

interface GameControlsProps {
  game: Game;
  dealtReady: boolean;
}

export function GameControls({ game, dealtReady }: GameControlsProps) {
  const isBetting = game.phase === Phase.BETTING;
  const isSettled = game.phase === Phase.SETTLED;

  return (
    <ControlsPanel>
      {isBetting && (
        <CasinoButton $variant="deal" onClick={() => game.dealRound(100)} disabled={!dealtReady}>
          Deal ({game.shoe.length} left)
        </CasinoButton>
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
        <CasinoButton $variant="danger" onClick={game.newRound} disabled={!dealtReady}>New Round</CasinoButton>
      )}
      {game.bankrupt && (
        <CasinoButton $variant="rebuy" onClick={game.rebuy}>Rebuy</CasinoButton>
      )}
    </ControlsPanel>
  );
}
