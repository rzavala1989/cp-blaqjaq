import {
  ValuesContainer,
  DealerValue,
  PlayerValue,
  ScoreDivider,
} from '../styled/styled-components';

interface ValuesProps {
  playerValue: number | string;
  dealerValue: number | string;
  dealerHasRevealed: boolean;
}

export const Values = ({ playerValue, dealerValue, dealerHasRevealed }: ValuesProps) => {
  return (
    <ValuesContainer>
      <DealerValue>{dealerHasRevealed ? dealerValue : '?'}</DealerValue>
      <ScoreDivider />
      <PlayerValue>{playerValue}</PlayerValue>
    </ValuesContainer>
  );
};
