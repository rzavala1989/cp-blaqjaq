import { useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ChipCount } from '../styled/styled-components';

const AnimatedChipCountInner = animated(ChipCount);

export function AnimatedChipCount({ value }) {
  const prefersReduced = useReducedMotion();
  const prevValue = useRef(value);

  const isGain = value > prevValue.current;
  const isLoss = value < prevValue.current;

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  const { number } = useSpring({
    number: value,
    config: { tension: 120, friction: 14, clamp: true },
    immediate: prefersReduced,
  });

  const { glow } = useSpring({
    from: {
      glow: isGain ? 1 : isLoss ? 1 : 0,
    },
    to: { glow: 0 },
    config: { duration: 600 },
    reset: true,
    immediate: prefersReduced,
  });

  const glowColor = isGain
    ? 'rgba(0, 255, 100, 0.8)'
    : isLoss
      ? 'rgba(255, 50, 50, 0.8)'
      : 'transparent';

  return (
    <AnimatedChipCountInner
      style={{
        textShadow: glow.to(
          (g) => `0 0 ${g * 20}px ${glowColor}`
        ),
      }}
    >
      {number.to((n) => `$${Math.floor(n)}`)}
    </AnimatedChipCountInner>
  );
}
