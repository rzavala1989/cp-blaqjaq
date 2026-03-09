import { useSpring } from '@react-spring/web';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CardInHand, CardFront, CardBack, CardLabel } from '../styled/styled-components';

const SUIT_SIGNS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

interface CardProps {
  rank: string;
  suit: string;
  faceDown?: boolean;
  top?: boolean;
}

export const Card = ({ rank, suit, faceDown, top }: CardProps) => {
  const prefersReduced = useReducedMotion();
  const blackSuit = suit === 'S' || suit === 'C';
  const sign = SUIT_SIGNS[suit];

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
