import styled from 'styled-components';
import { playChipClick } from '../utils/sounds';
import type { useBlackjack } from '../hooks/useBlackjack';
import { ChipButton, BetDisplay, CasinoButton } from '../styled/styled-components';

type Game = ReturnType<typeof useBlackjack>;

const CHIP_COLORS: Record<number, string> = {
  10:  '#2244aa',
  25:  '#1a6b2a',
  100: '#555555',
  500: '#4a1a6b',
};

const DENOMINATIONS = [10, 25, 100, 500];

const BettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

interface BettingPanelProps {
  game: Game;
  currentBet: number;
  addToBet: (n: number) => void;
  clearBet: () => void;
  onDeal: () => void;
  dealtReady: boolean;
}

export function BettingPanel({ game, currentBet, addToBet, clearBet, onDeal, dealtReady }: BettingPanelProps) {
  const minBet = game.config.minimumBet;
  const maxBet = game.config.maximumBet;

  return (
    <BettingRow>
      {DENOMINATIONS.map(denom => {
        const disabled = currentBet + denom > maxBet || currentBet + denom > game.chips;
        return (
          <ChipButton
            key={denom}
            $color={CHIP_COLORS[denom]}
            disabled={disabled}
            onClick={() => { addToBet(denom); playChipClick(); }}
          >
            {denom}
          </ChipButton>
        );
      })}
      <BetDisplay>◆ {currentBet}</BetDisplay>
      <CasinoButton $variant="danger" onClick={clearBet} disabled={currentBet <= minBet}>
        Clear
      </CasinoButton>
      <CasinoButton $variant="deal" onClick={onDeal} disabled={!dealtReady || game.chips < currentBet || game.bankrupt}>
        Deal
      </CasinoButton>
    </BettingRow>
  );
}
