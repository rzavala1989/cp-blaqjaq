import { useEffect, useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

const MODEL_PATH = '/models/52-card_deck/scene.gltf';
const DECK_COUNT = 6;
const DECK_Y_OFFSET = 0.0215;
const TOTAL_CARDS = 312;

interface CardDeckProps {
  dealtCount?: number;
  shuffleKey?: number;
  onShuffleComplete?: () => void;
}

export function CardDeck({ dealtCount = 0, shuffleKey = 0, onShuffleComplete }: CardDeckProps) {
  const dynamicOffset = DECK_Y_OFFSET * (TOTAL_CARDS - dealtCount) / TOTAL_CARDS;
  const { scene } = useGLTF(MODEL_PATH);

  const clones = useMemo(
    () => Array.from({ length: DECK_COUNT }, () => scene.clone(true)),
    [scene]
  );

  const deckRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    clones.forEach((clone) => {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }, [clones]);

  useEffect(() => {
    if (shuffleKey === 0) return;

    const refs = deckRefs.current.filter(Boolean) as THREE.Group[];
    const tl = gsap.timeline({ onComplete: onShuffleComplete });

    // Scatter: each deck flies to a random spot
    refs.forEach((ref, i) => {
      const angle = (i / DECK_COUNT) * Math.PI * 2;
      const radius = 0.08 + Math.random() * 0.06;
      tl.to(ref.position, {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: 0.04 + Math.random() * 0.06,
        duration: 0.25,
        ease: 'power2.out',
      }, i * 0.04);
    });

    // Reassemble back to stack
    refs.forEach((ref, i) => {
      tl.to(ref.position, {
        x: 0,
        z: 0,
        y: i * dynamicOffset,
        duration: 0.35,
        ease: 'power3.inOut',
      }, 0.5 + i * 0.05);
    });

    return () => { tl.kill(); };
  }, [shuffleKey]);

  return (
    <group position={[0.5, 0.085, -0.38]} rotation={[0, Math.PI / 6, 0]}>
      {clones.map((clone, i) => (
        <group
          key={i}
          ref={(el) => { deckRefs.current[i] = el; }}
          position={[0, i * dynamicOffset, 0]}
          scale={[0.18, 0.18, 0.18]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <primitive object={clone} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
