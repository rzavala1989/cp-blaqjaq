import { useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { ScreenFlash } from '../styled/styled-components';

type ResultConfig = {
  bg: string;
  color: string;
  label: string;
};

// Film noir results: marquee lights, blood on the floor, the long goodbye
const RESULT_CONFIGS: Record<string, ResultConfig> = {
  'player-blackjack': { bg: 'rgba(200, 20, 42, 0.1)',  color: '#e8e0d0', label: 'BLACKJACK' },
  'player-win':       { bg: 'rgba(0, 0, 0, 0.06)',     color: '#b8d0c8', label: 'WIN'       },
  'dealer-bust':      { bg: 'rgba(0, 0, 0, 0.06)',     color: '#b8d0c8', label: 'WIN'       },
  'dealer-win':       { bg: 'rgba(200, 20, 42, 0.1)',  color: '#c81428', label: 'LOSE'      },
  'player-bust':      { bg: 'rgba(200, 20, 42, 0.08)', color: '#a01020', label: 'BUST'      },
  'push':             { bg: 'rgba(0, 0, 0, 0.04)',     color: 'rgba(200, 185, 155, 0.45)', label: 'PUSH' },
  'surrender':        { bg: 'rgba(120, 90, 20, 0.07)', color: 'rgba(170, 132, 50, 0.75)', label: 'SURRENDER' },
};

interface ResultFlashProps {
  result: string | null;
  triggerKey: number;
}

export function ResultFlash({ result, triggerKey }: ResultFlashProps) {
  const config = result ? RESULT_CONFIGS[result] : null;

  const [spring, api] = useSpring(() => ({ opacity: 0 }));

  useEffect(() => {
    if (!config) return;
    api.start({
      from: { opacity: 0 },
      to: [
        { opacity: 0.9, config: { duration: 150 } },
        { opacity: 0.9, config: { duration: 1000 } },
        { opacity: 0,   config: { duration: 500 } },
      ],
    });
  }, [triggerKey]);

  if (!config) return null;

  return (
    <>
      <ScreenFlash style={{ opacity: spring.opacity, background: config.bg }} />
      <animated.div
        style={{
          opacity: spring.opacity,
          color: config.color,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '5.5rem',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          pointerEvents: 'none',
          textShadow: `0 0 30px ${config.color}, 0 0 80px ${config.color}66, 0 4px 16px rgba(0,0,0,0.95)`,
          zIndex: 60,
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </animated.div>
    </>
  );
}
