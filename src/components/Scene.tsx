import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { useBlackjack } from '../hooks/useBlackjack';
import { useSounds } from '../hooks/useSounds';
import { GameTable } from './GameTable';
import { GameControls } from './GameControls';
import { ResultFlash } from './ResultFlash';
import { StatsPanel } from './StatsPanel';
import { Phase } from '../game/constants';
import { SceneWrapper, SceneNotification } from '../styled/styled-components';

const NOTIFICATION_DURATION_MS = 3000;
// How long to wait after card count changes before allowing interaction.
// Initial deal (4 cards): D1 settles at ~1120ms. 1250ms gives 130ms margin.
// Hit/dealer-hit (1 card): settles at ~450ms. 600ms gives 150ms margin.
const DEAL_READY_MS = 1250;
const HIT_READY_MS = 600;

export default function Scene() {
  const game = useBlackjack();

  const [controlsReady, setControlsReady] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [dealtReady, setDealtReady] = useState(true);

  // Betting state
  const [currentBet, setCurrentBet] = useState(game.config.minimumBet);

  const addToBet = useCallback((n: number) => {
    setCurrentBet(prev => Math.min(prev + n, game.config.maximumBet, game.chips));
  }, [game.config.maximumBet, game.chips]);

  const clearBet = useCallback(() => {
    setCurrentBet(game.config.minimumBet);
  }, [game.config.minimumBet]);

  const handleDeal = useCallback(() => {
    game.dealRound(currentBet);
    clearBet();
  }, [currentBet, game, clearBet]);

  // Result flash state
  const [flashResult, setFlashResult] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  // Stats tracking
  const prevChipsRef = useRef(game.chips);
  const streakRef = useRef<{ type: 'W' | 'L' | null; count: number }>({ type: null, count: 0 });
  const [streakDisplay, setStreakDisplay] = useState<{ type: 'W' | 'L' | null; count: number }>({ type: null, count: 0 });

  const notifTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dealtReadyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevShoeLengthRef = useRef(game.shoe.length);
  const prevCardCountRef = useRef(0);
  const prevPhaseRef = useRef(game.phase);

  const totalCardCount = useMemo(
    () => game.hands.reduce((s, h) => s + h.cards.length, 0) + game.dealerHand.length,
    [game.hands, game.dealerHand]
  );

  // Watch phase for result flash and streak tracking
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = game.phase;

    if (game.phase === Phase.SETTLED && prevPhase !== Phase.SETTLED) {
      const result = game.hands[0]?.result;
      if (result) {
        setFlashResult(result);
        setFlashKey(k => k + 1);

        const isWin = result === 'player-win' || result === 'dealer-bust' || result === 'player-blackjack';
        const isLoss = result === 'dealer-win' || result === 'player-bust';

        if (isWin) {
          streakRef.current = streakRef.current.type === 'W'
            ? { type: 'W', count: streakRef.current.count + 1 }
            : { type: 'W', count: 1 };
        } else if (isLoss) {
          streakRef.current = streakRef.current.type === 'L'
            ? { type: 'L', count: streakRef.current.count + 1 }
            : { type: 'L', count: 1 };
        } else {
          streakRef.current = { type: null, count: 0 };
        }
        setStreakDisplay({ ...streakRef.current });
      }
    }
  }, [game.phase, game.hands]);

  // Track card count changes to gate interaction until animations settle
  useEffect(() => {
    if (totalCardCount === 0) {
      prevCardCountRef.current = 0;
      setDealtReady(true);
      return;
    }
    if (totalCardCount > prevCardCountRef.current) {
      const wasEmpty = prevCardCountRef.current === 0;
      prevCardCountRef.current = totalCardCount;
      setDealtReady(false);
      clearTimeout(dealtReadyTimerRef.current);
      dealtReadyTimerRef.current = setTimeout(
        () => setDealtReady(true),
        wasEmpty ? DEAL_READY_MS : HIT_READY_MS
      );
    }
  }, [totalCardCount]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), NOTIFICATION_DURATION_MS);
  }, []);

  // Detect auto-reshuffle: shoe jumped back up in size
  useEffect(() => {
    if (game.shoe.length > prevShoeLengthRef.current) {
      setShuffleKey(k => k + 1);
      showNotification('New shoe in play');
    }
    prevShoeLengthRef.current = game.shoe.length;
  }, [game.shoe.length, showNotification]);

  // New deal: dealer gets 2 cards
  useEffect(() => {
    if (game.dealerHand.length === 2) setRoundKey(k => k + 1);
  }, [game.dealerHand.length]);

  const handleIntroComplete = useCallback(() => setControlsReady(true), []);

  useSounds(game);

  const sessionPnL = game.chips - game.config.startingChips;

  return (
    <SceneWrapper>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{
          fov: 60,
          near: 0.1,
          far: 100,
          position: [0, 16, 20],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <GameTable
          dealerCards={game.dealerHand}
          playerCards={game.hands[0]?.cards ?? []}
          shoeLength={game.shoe.length}
          shuffleKey={shuffleKey}
          roundKey={roundKey}
          controlsReady={controlsReady}
          onCameraIntroComplete={handleIntroComplete}
        />
      </Canvas>

      <GameControls
        game={game}
        dealtReady={dealtReady}
        currentBet={currentBet}
        addToBet={addToBet}
        clearBet={clearBet}
        onDeal={handleDeal}
      />

      <ResultFlash result={flashResult} triggerKey={flashKey} />

      <StatsPanel
        game={game}
        sessionPnL={sessionPnL}
        streak={streakDisplay}
      />

      {notification && <SceneNotification>{notification}</SceneNotification>}
    </SceneWrapper>
  );
}
