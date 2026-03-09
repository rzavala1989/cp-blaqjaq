import { useTrail, useTransition, animated, to } from '@react-spring/web';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Card } from './Card';
import { Container, ActiveContainer, AnimatedResultOverlay } from '../styled/styled-components';
import { Result } from '../game/constants';
import type { ResultValue } from '../game/constants';
import type { Card as CardType } from '../game/deck';

const RESULT_DISPLAY: Record<ResultValue, { text: string; color: string }> = {
  [Result.PLAYER_BLACKJACK]: { text: 'BLACKJACK', color: 'gold' },
  [Result.PLAYER_WIN]: { text: 'WIN', color: '#4caf50' },
  [Result.DEALER_BUST]: { text: 'WIN', color: '#4caf50' },
  [Result.DEALER_WIN]: { text: 'LOSE', color: 'rgb(169,0,0)' },
  [Result.PLAYER_BUST]: { text: 'BUST', color: 'rgb(169,0,0)' },
  [Result.PUSH]: { text: 'PUSH', color: 'gold' },
  [Result.SURRENDER]: { text: 'SURRENDER', color: 'grey' },
};

interface HandProps {
  cards?: CardType[];
  result?: ResultValue | null;
  top?: boolean;
  isActive?: boolean;
}

export const Hand = ({ cards = [], result, top, isActive }: HandProps) => {
  const prefersReduced = useReducedMotion();
  const display = result ? RESULT_DISPLAY[result] : null;
  const Wrapper = isActive ? ActiveContainer : Container;

  const trail = useTrail(cards.length, {
    from: { x: 300, y: top ? -200 : 200, opacity: 0, scale: 0.7 },
    to: { x: 0, y: 0, opacity: 1, scale: 1 },
    config: { mass: 1.2, tension: 200, friction: 26 },
    immediate: prefersReduced,
  });

  const resultTransition = useTransition(display, {
    from: { opacity: 0, scale: 2.5, blur: 10 },
    enter: { opacity: 1, scale: 1, blur: 0 },
    leave: { opacity: 0, scale: 0.8, blur: 5 },
    config: { tension: 300, friction: 20 },
    immediate: prefersReduced,
  });

  return (
    <Wrapper>
      {resultTransition((style, item) =>
        item ? (
          <AnimatedResultOverlay
            $color={item.color}
            style={{
              opacity: style.opacity,
              transform: style.scale.to((s) => `scale(${s})`),
              filter: style.blur.to((b) => `blur(${b}px)`),
            }}
          >
            {item.text}
          </AnimatedResultOverlay>
        ) : null
      )}
      {trail.map((spring, index) => (
        <animated.div
          key={index}
          style={{
            transform: to(
              [spring.x, spring.y, spring.scale],
              (x, y, s) => `translate3d(${x}px, ${y}px, 0) scale(${s})`
            ),
            opacity: spring.opacity,
          }}
        >
          <Card
            top={top}
            rank={cards[index].rank}
            suit={cards[index].suit}
            faceDown={cards[index].faceDown}
          />
        </animated.div>
      ))}
    </Wrapper>
  );
};
