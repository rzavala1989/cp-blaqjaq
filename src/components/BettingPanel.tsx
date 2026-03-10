import styled from 'styled-components';
import { playChipClick } from '../utils/sounds';
import type { useBlackjack } from '../hooks/useBlackjack';
import { ChipButton, CasinoButton } from '../styled/styled-components';

type Game = ReturnType<typeof useBlackjack>;

// Film noir chip palette: ivory dime, blood red quarter, cold steel c-note, tarnished gold big stack
const CHIP_COLORS: Record<number, string> = {
  10:  'rgba(210, 198, 170, 0.55)',
  25:  'rgba(200, 20, 42, 0.75)',
  100: 'rgba(58, 104, 152, 0.85)',
  500: 'rgba(170, 132, 40, 0.75)',
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
      <CasinoButton $variant="danger" onClick={clearBet} disabled={currentBet <= minBet}>
        Clear
      </CasinoButton>
      <CasinoButton $variant="deal" onClick={onDeal} disabled={!dealtReady || game.chips < currentBet || game.bankrupt}>
        Deal
      </CasinoButton>
    </BettingRow>
  );
}
