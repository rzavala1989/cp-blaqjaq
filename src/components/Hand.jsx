import React from 'react';
import { Card } from './Card';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 1rem 0;
`;

const Result = styled.h2`
  position: absolute;
  font-size: 3rem;
  z-index: 2;
`;

export const Hand = ({ cards = [], blackjack, win, lose, top }) => {
  return (
    <>
      <Container>
        {win && <Result style={{ color: 'green' }}>WIN</Result>}
        {blackjack && <Result style={{ color: 'navy' }}>BLACKJACK</Result>}
        {lose && <Result style={{ color: 'rgb(169,0,0)' }}>LOSE</Result>}
        {cards.map((card, index) => (
          <Card
            top={top}
            key={index}
            rank={card.rank}
            suit={card.suit}
            faceDown={card.faceDown}
          />
        ))}
      </Container>
    </>
  );
};
