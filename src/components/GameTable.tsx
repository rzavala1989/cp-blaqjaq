import { Suspense, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

import type { Card } from '../game/deck';
import { Lighting } from './Lighting';
import { BlackjackTable } from './models/BlackjackTable';
import { WhiskeyGlass } from './models/WhiskeyGlass';
import { Colt1911 } from './models/Colt1911';
import { Floor } from './Floor';
import { CardDeck } from './models/CardDeck';
import { DealtCard } from './models/DealtCard';
import { FedoraHat } from './models/FedoraHat';
import { ChipTray } from './models/ChipTray';

const TOTAL_CARDS = 312;

interface CameraIntroProps {
  onComplete: () => void;
}

function CameraIntro({ onComplete }: CameraIntroProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 16, 20);
    camera.lookAt(0, 0, 0);

    const proxy = { angle: 0, y: 16, r: 20 };
    gsap.to(proxy, {
      angle: Math.PI,
      y: 0.5,
      r: 1.8,
      duration: 3.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(
          Math.sin(proxy.angle) * proxy.r,
          proxy.y,
          Math.cos(proxy.angle) * proxy.r
        );
        camera.lookAt(0, 0, 0);
      },
      onComplete: () => onComplete(),
    });
  }, [camera, onComplete]);

  return null;
}

export interface GameTableProps {
  dealerCards: Card[];
  playerCards: Card[];
  shoeLength: number;
  shuffleKey: number;
  roundKey: number;
  controlsReady: boolean;
  onCameraIntroComplete: () => void;
}

export function GameTable({
  dealerCards,
  playerCards,
  shoeLength,
  shuffleKey,
  roundKey,
  controlsReady,
  onCameraIntroComplete,
}: GameTableProps) {
  const dealtCount = TOTAL_CARDS - shoeLength;

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', 0.018]} />

      <CameraIntro onComplete={onCameraIntroComplete} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
        enabled={controlsReady}
      />

      <Lighting />

      <Suspense fallback={null}>
        <BlackjackTable />
        <WhiskeyGlass />
        <Colt1911 />
        <FedoraHat />
        <CardDeck
          dealtCount={dealtCount}
          shuffleKey={shuffleKey}
        />
        <DealtCard
          roundKey={roundKey}
          dealerCards={dealerCards}
          playerCards={playerCards}
        />
        <ChipTray />
        <Floor />
        <AccumulativeShadows
          position={[0, 0.01, 0]}
          frames={60}
          opacity={0.8}
          scale={6}
          color="#1a0d00"
        >
          <RandomizedLight
            amount={4}
            radius={2}
            intensity={1}
            position={[0, 8, 0]}
            bias={0.001}
          />
        </AccumulativeShadows>
      </Suspense>

      <EffectComposer>
        <Bloom luminanceThreshold={0.85} intensity={0.4} radius={0.5} />
        <Vignette darkness={0.6} offset={0.4} />
      </EffectComposer>
    </>
  );
}
