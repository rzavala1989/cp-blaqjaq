import styled, { keyframes } from 'styled-components';
import { animated } from '@react-spring/web';

// === Game Board ===

export const GameBoard = styled.div`
  text-align: center;
  background: #1a4a32;
  color: white;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'DM Sans', sans-serif;
  align-items: center;
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

// === Stats ===

export const PlayerInfo = styled.div`
  position: absolute;
  font-size: 1.8rem;
  left: 0.7rem;
  top: 0.3rem;
  color: rgba(180, 180, 180, 0.8);
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;
export const PlayerScore = styled.div`
  font-size: 2.1rem;
  color: rgba(180, 180, 180, 0.6);
`;

export const DealerInfo = styled.div`
  position: absolute;
  font-size: 1.8rem;
  right: 0.7rem;
  top: 0.3rem;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;
export const DealerScore = styled.div`
  font-size: 2.1rem;
  color: rgba(255, 255, 255, 0.6);
`;

// === Hit and Stand ===

export const HitButton = styled.button`
  height: 27%;
  font-size: 3rem;
  padding: 5.7rem;
  background: linear-gradient(
    to right,
    rgba(212, 211, 210, 0.86),
    rgba(96, 96, 96, 0.86),
    rgba(96, 96, 96, 0.86),
    rgba(56, 56, 56, 0.94),
    rgba(36, 36, 36, 0.94),
    rgba(29, 77, 65, 0.56),
    rgba(29, 77, 65, 0.46),
    rgba(29, 77, 65, 0.36)
  );
  color: white;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: 61%;
  position: absolute;
  bottom: 0;
  left: 0;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  border: none;
  transition: all 0.25s ease;

  -webkit-clip-path: polygon(0 0%, 0 100%, 100% 100%);
  clip-path: polygon(0 0%, 0 100%, 100% 100%);

  &:hover:not(:disabled) {
    filter: brightness(1.15);
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }

  &:active:not(:disabled) {
    filter: brightness(0.9);
    transition-duration: 0.05s;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    filter: grayscale(0.5) brightness(0.6);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StandButton = styled.button`
  height: 27%;
  font-size: 3rem;
  padding: 5.7rem;
  padding-right: 7.7rem !important;
  background: linear-gradient(
    to right,
    rgba(29, 77, 65, 0.31),
    rgba(29, 77, 65, 0.51),
    rgba(29, 77, 65, 0.61),
    rgba(29, 77, 65, 0.81),
    rgba(212, 211, 210, 0.66),
    rgba(212, 211, 210, 0.6),
    rgba(212, 211, 210, 0.6),
    rgba(212, 211, 210, 0.55),
    rgba(44, 48, 112, 0.45),
    rgb(220, 20, 60, 0.69)
  );
  color: white;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: 61%;
  position: absolute;
  bottom: 0;
  right: 0;
  cursor: pointer;
  display: flex;
  justify-content: flex-end;
  border: none;
  transition: all 0.25s ease;

  -webkit-clip-path: polygon(100% 0%, 0 100%, 100% 100%);
  clip-path: polygon(100% 0%, 0 100%, 100% 100%);

  &:hover:not(:disabled) {
    filter: brightness(1.15);
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }

  &:active:not(:disabled) {
    filter: brightness(0.9);
    transition-duration: 0.05s;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    filter: grayscale(0.5) brightness(0.6);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// === Card ===

export const CardInHand = styled.div`
  position: relative;
  width: 100px;
  height: 150px;
  line-height: 30px;
  margin-left: -30px;
  text-align: left;
  font-size: 1.4rem;
  border-radius: 5px;
  transform-style: preserve-3d;
`;

export const CardFront = styled(animated.div)<{ $blackSuit: boolean }>(
  ({ $blackSuit }) => `
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
  background-color: white;
  color: ${$blackSuit ? 'black' : 'crimson'};
`
);

export const CardBack = styled(animated.div)`
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
  background-image: linear-gradient(
      rgba(0, 0, 0, 0.77),
      rgba(0, 0, 0, 0.25),
      rgba(0, 0, 0, 0)
    ),
    url('/back-of-card.jpg');
  background-size: cover;
  background-position: -3px 0px;
`;

export const CardLabel = styled.div`
  margin: 5px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
`;

// === Hand ===

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 1rem 0;
`;

export const ActiveContainer = styled(Container)`
  outline: 2px solid gold;
  border-radius: 8px;
`;

export const ResultOverlay = styled.h2<{ $color?: string }>`
  position: absolute;
  font-size: 3rem;
  z-index: 2;
  color: ${({ $color }) => $color || 'white'};
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
`;

export const AnimatedResultOverlay = styled(animated.h2)<{ $color?: string }>`
  position: absolute;
  font-size: 3rem;
  z-index: 2;
  color: ${({ $color }) => $color || 'white'};
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
`;

// === Chip Count ===

export const ChipCount = styled.div`
  position: absolute;
  top: 3.5rem;
  left: 0.7rem;
  color: gold;
  font-size: 1.4rem;
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

// === Action Buttons ===

export const ActionRow = styled.div<{ $compact?: boolean }>`
  display: flex;
  gap: 0.5rem;
  margin-top: ${({ $compact }) => ($compact ? '0.5rem' : '1rem')};
  z-index: 10;
`;

export const ActionButton = styled.button<{ $large?: boolean; $muted?: boolean }>`
  padding: ${({ $large }) => ($large ? '0.7rem 1.2rem' : '0.5rem 1rem')};
  font-size: ${({ $large }) => ($large ? '1.2rem' : '1rem')};
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $muted }) =>
    $muted ? 'rgba(96, 96, 96, 0.8)' : 'rgba(29, 77, 65, 0.8)'};
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(29, 77, 65, 0.4), 0 0 15px rgba(29, 77, 65, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    background: ${({ $muted }) =>
      $muted ? 'rgba(120, 120, 120, 0.85)' : 'rgba(35, 100, 80, 0.9)'};
  }

  &:active:not(:disabled) {
    transform: translateY(1px) scale(0.97);
    box-shadow: 0 1px 8px rgba(29, 77, 65, 0.3);
    transition-duration: 0.05s;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
    filter: grayscale(0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover:not(:disabled) { transform: none; }
    &:active:not(:disabled) { transform: none; }
  }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(29, 77, 65, 0.3); }
  50% { box-shadow: 0 0 25px rgba(29, 77, 65, 0.6), 0 0 50px rgba(29, 77, 65, 0.15); }
`;

export const NewRoundButton = styled.button`
  padding: 0.7rem 1.5rem;
  font-size: 1.2rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: rgba(29, 77, 65, 0.9);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  margin-top: 1rem;
  z-index: 10;
  transition: all 0.2s ease;
  animation: ${pulseGlow} 2s ease-in-out infinite;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 25px rgba(29, 77, 65, 0.5);
  }

  &:active {
    transform: translateY(1px);
    transition-duration: 0.05s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    &:hover { transform: none; }
    &:active { transform: none; }
  }
`;

// === Scoreboard ===

export const ValuesContainer = styled.div`
  font-size: 2rem;
  width: 12rem;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
`;
export const DealerValue = styled.div`
  margin: 0 1rem;
  text-align: left;
`;
export const PlayerValue = styled.div`
  margin: 0 1rem;
  text-align: right;
`;
export const ScoreDivider = styled.hr`
  transform: rotate(-35deg);
  margin: 1rem;
  border-color: rgba(255, 255, 255, 0.2);
`;

// === Screen Flash ===

export const ScreenFlash = styled(animated.div)`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
`;
