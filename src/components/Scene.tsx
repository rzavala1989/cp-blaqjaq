import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { useBlackjack } from '../hooks/useBlackjack';
import { GameTable } from './GameTable';
import { GameControls } from './GameControls';
import { GameHUD } from './GameHUD';
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

  const notifTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dealtReadyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevShoeLengthRef = useRef(game.shoe.length);
  const prevCardCountRef = useRef(0);

  const totalCardCount = useMemo(
    () => game.hands.reduce((s, h) => s + h.cards.length, 0) + game.dealerHand.length,
    [game.hands, game.dealerHand]
  );

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

      <GameHUD game={game} dealtReady={dealtReady} />

      <GameControls game={game} dealtReady={dealtReady} />

      {notification && <SceneNotification>{notification}</SceneNotification>}
    </SceneWrapper>
  );
}
