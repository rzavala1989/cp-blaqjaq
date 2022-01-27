import React from 'react';
import styled from 'styled-components';

const ValuesContainer = styled.div`
  font-size: 2rem;
  width: 12rem;
`;
const DealerValue = styled.div`
  margin: 0 1rem;
  text-align: left;
`;
const PlayerValue = styled.div`
  margin: 0 1rem;
  text-align: right;
`;
const ScoreDivider = styled.hr`
  transform: rotate(-35deg);
  margin: 1rem;
`;

export const Values = ({ playerValue, dealerValue, dealerHasRevealed }) => {
  return (
    <ValuesContainer>
      <DealerValue>{dealerHasRevealed ? dealerValue : '?'}</DealerValue>
      <ScoreDivider />
      <PlayerValue>{playerValue}</PlayerValue>
    </ValuesContainer>
  );
};
