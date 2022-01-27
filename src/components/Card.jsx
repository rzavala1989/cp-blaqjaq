import React, { useState, useEffect } from 'react';
import { useSpring } from 'react-spring';
//import styled components
import { CardInHand, CardFront, CardBack, CardLabel } from '../styled/styled-components';



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
