import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSpring, animated } from 'react-spring';

const CardInHand = styled.div`
  position: relative;
  width: 100px;
  height: 150px;
  line-height: 30px;
  margin-left: -30px;
  text-align: left;
  font-size: 1.4rem;
  border-radius: 5px;
`;
const CardFront = styled(animated.div)(
  ({ blackSuit, isTop }) => `
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 3px 4px 8px rgba(157,34,53, 0.629);
  background-color: white;
  background-image: ${
    isTop
      ? 'linear-gradient(rgba(0, 0, 0, 0.77),rgba(0, 0, 0, 0.25),rgba(0, 0, 0, 0))'
      : 'linear-gradient(white, white, white)'
  };
  color: ${blackSuit ? 'black' : isTop ? 'rgb(169,0,0)' : 'crimson'};
`
);

const CardBack = styled(animated.div)`
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 3px 4px 8px rgba(157, 34, 53, 0.629);
  background-image: linear-gradient(
      rgba(0, 0, 0, 0.77),
      rgba(0, 0, 0, 0.25),
      rgba(0, 0, 0, 0)
    ),
    url('/back-of-card.jpg');
  background-size: cover;
  background-position: -3px 0px;
`;

const CardLabel = styled.div`
  margin: 5px;
`;

export const Card = ({ rank, suit, faceDown, top }) => {
  const [isTurnedOver, setIsTurnedOver] = useState(false);
  const { transform, opacity } = useSpring({
    opacity: isTurnedOver ? 0 : 1,
    transform: `perspective(600px) rotateX(${isTurnedOver ? 0 : 180}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });
  useEffect(() => {
    if (!faceDown && !isTurnedOver) setIsTurnedOver(true);
  }, [faceDown, isTurnedOver]);

  let sign, blackSuit, isTop;
  if (suit === 'S' || suit === 'C') blackSuit = true;
  if (top === true) isTop = true;
  if (suit === 'S') sign = '♠';
  if (suit === 'H') sign = '♥';
  if (suit === 'D') sign = '♦';
  if (suit === 'C') sign = '♣';

  return (
    <CardInHand>
      {!faceDown ? (
        <CardFront
          style={{
            opacity: opacity.to((o) => 1 - o),
            transform,
          }}
          blackSuit={blackSuit}
          isTop={isTop}
        >
          <CardLabel>
            {rank} <br />
            {sign}
          </CardLabel>
        </CardFront>
      ) : (
        <CardBack
          style={{
            opacity,
            transform: transform.to((t) => `${t} rotateX(180deg)`),
          }}
        />
      )}
    </CardInHand>
  );
};
