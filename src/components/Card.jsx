import { useSpring } from '@react-spring/web';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CardInHand, CardFront, CardBack, CardLabel } from '../styled/styled-components';

const SUIT_SIGNS = { S: '♠', H: '♥', D: '♦', C: '♣' };

export const Card = ({ rank, suit, faceDown, top }) => {
  const prefersReduced = useReducedMotion();
  const blackSuit = suit === 'S' || suit === 'C';
  const sign = SUIT_SIGNS[suit];

  // Both faces always rendered. Spring drives rotateY.
  // faceDown=true  -> back visible (rotateY 0), front hidden (rotateY 180)
  // faceDown=false -> back hidden (rotateY -180), front visible (rotateY 0)
  const { rotateY } = useSpring({
    rotateY: faceDown ? 0 : -180,
    config: { mass: 6, tension: 400, friction: 60 },
    immediate: prefersReduced,
  });

  return (
    <CardInHand>
      <CardBack
        style={{
          transform: rotateY.to((r) => `perspective(600px) rotateY(${r}deg)`),
          backfaceVisibility: 'hidden',
        }}
      />
      <CardFront
        $blackSuit={blackSuit}
        style={{
          transform: rotateY.to((r) => `perspective(600px) rotateY(${r + 180}deg)`),
          backfaceVisibility: 'hidden',
        }}
      >
        <CardLabel>
          {rank} <br />
          {sign}
        </CardLabel>
      </CardFront>
    </CardInHand>
  );
};
