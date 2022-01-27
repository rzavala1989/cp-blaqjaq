import React from 'react';
//import styled components
import {
  ValuesContainer,
  DealerValue,
  PlayerValue,
  ScoreDivider,
} from '../styled/styled-components';

export const Values = ({ playerValue, dealerValue, dealerHasRevealed }) => {
  return (
    <ValuesContainer>
      <DealerValue>{dealerHasRevealed ? dealerValue : '?'}</DealerValue>
      <ScoreDivider />
      <PlayerValue>{playerValue}</PlayerValue>
    </ValuesContainer>
  );
};
