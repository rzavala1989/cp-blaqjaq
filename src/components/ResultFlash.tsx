import { useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { ScreenFlash } from '../styled/styled-components';

type ResultConfig = {
  bg: string;
  color: string;
  label: string;
};

const RESULT_CONFIGS: Record<string, ResultConfig> = {
  'player-blackjack': { bg: 'rgba(212,175,80,0.2)',  color: '#ffd700', label: 'BLACKJACK' },
  'player-win':       { bg: 'rgba(60,160,80,0.18)',  color: '#6adf8a', label: 'WIN'       },
  'dealer-bust':      { bg: 'rgba(60,160,80,0.18)',  color: '#6adf8a', label: 'WIN'       },
  'dealer-win':       { bg: 'rgba(180,50,50,0.18)',  color: '#df6a6a', label: 'LOSE'      },
  'player-bust':      { bg: 'rgba(180,50,50,0.18)',  color: '#df6a6a', label: 'BUST'      },
  'push':             { bg: 'rgba(180,180,180,0.1)', color: '#cccccc', label: 'PUSH'      },
  'surrender':        { bg: 'rgba(120,90,20,0.15)',  color: '#c8a040', label: 'SURRENDER' },
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
          fontSize: '5rem',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          pointerEvents: 'none',
          textShadow: '0 0 40px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9)',
          zIndex: 60,
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </animated.div>
    </>
  );
}
