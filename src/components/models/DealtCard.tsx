import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Card } from '../../game/deck';

const SUIT_SIGNS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RED_SUITS = new Set(['H', 'D']);

const DECK_POS: [number, number, number] = [0.5, 0.1, -0.38];

// Dealer first card position (user-placed), spread right by CARD_SPREAD per card
const DEALER_ORIGIN: [number, number, number] = [-0.05, 0.069, -0.48];
// Player cards, in front of betting circle
const PLAYER_ORIGIN: [number, number, number] = [-0.05, 0.069, -1.15];
const CARD_SPREAD = 0.07;

// Initial deal: P0=0, D0=15, P1=30, D1=45 frames — classic casino stagger
// Hit cards (index >= 2) come from the deck immediately
function getDealDelay(slot: 'dealer' | 'player', index: number): number {
  if (index >= 2) return 4;
  const order = slot === 'player' ? index * 2 : index * 2 + 1;
  return order * 15;
}

function makeCardTexture(rank: string, suit: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 358;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 358, 14);
  ctx.fill();

  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, 254, 356, 13);
  ctx.stroke();

  const color = RED_SUITS.has(suit) ? '#cc2222' : '#111111';
  const sign = SUIT_SIGNS[suit];
  ctx.fillStyle = color;

  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'left';
  ctx.fillText(rank, 14, 58);
  ctx.font = '34px serif';
  ctx.fillText(sign, 18, 92);

  ctx.font = '130px serif';
  ctx.textAlign = 'center';
  ctx.fillText(sign, 128, 220);

  ctx.save();
  ctx.translate(256, 358);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'left';
  ctx.fillText(rank, 14, 58);
  ctx.font = '34px serif';
  ctx.fillText(sign, 18, 92);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function makeBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 358;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1a8c';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 358, 14);
  ctx.fill();

  ctx.strokeStyle = '#f0e6c8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 338, 10);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(240,230,200,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(18, 18, 220, 322, 8);
  ctx.stroke();

  // Diagonal crosshatch
  ctx.strokeStyle = 'rgba(240,230,200,0.12)';
  ctx.lineWidth = 1;
  for (let i = -358; i < 614; i += 14) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 358, 358); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i + 358, 0); ctx.lineTo(i, 358); ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// Module-level texture caches
const faceCache = new Map<string, THREE.CanvasTexture>();
let _backTex: THREE.CanvasTexture | null = null;

function getBackTexture(): THREE.CanvasTexture {
  if (!_backTex) _backTex = makeBackTexture();
  return _backTex;
}

function getFaceTexture(rank: string, suit: string): THREE.CanvasTexture {
  const key = `${rank}${suit}`;
  if (!faceCache.has(key)) faceCache.set(key, makeCardTexture(rank, suit));
  return faceCache.get(key)!;
}

interface CardMeshProps {
  card: Card;
  position: [number, number, number];
  dealDelay: number;
}

function CardMesh({ card, position, dealDelay }: CardMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const posRef = useRef(new THREE.Vector3(...DECK_POS));
  const frameRef = useRef(0);
  const settledRef = useRef(false);
  const target = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]]);

  // Swap texture when faceDown is revealed
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.map = card.faceDown ? getBackTexture() : getFaceTexture(card.rank, card.suit);
    matRef.current.needsUpdate = true;
  }, [card.faceDown, card.rank, card.suit]);

  useFrame(() => {
    if (!meshRef.current || settledRef.current) return;
    if (frameRef.current < dealDelay) { frameRef.current++; return; }
    posRef.current.lerp(target, 0.29);
    meshRef.current.position.copy(posRef.current);
    if (posRef.current.distanceTo(target) < 0.0005) {
      meshRef.current.position.copy(target);
      settledRef.current = true;
    }
  });

  const texture = card.faceDown ? getBackTexture() : getFaceTexture(card.rank, card.suit);

  return (
    <mesh ref={meshRef} position={DECK_POS} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.064, 0.089]} />
      <meshStandardMaterial ref={matRef} map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

export interface DealtCardProps {
  roundKey: number;
  dealerCards: Card[];
  playerCards: Card[];
}

export function DealtCard({ roundKey, dealerCards, playerCards }: DealtCardProps) {
  return (
    <group>
      {dealerCards.map((card, i) => (
        <CardMesh
          key={`r${roundKey}-dealer-${i}`}
          card={card}
          position={[DEALER_ORIGIN[0] + i * CARD_SPREAD, DEALER_ORIGIN[1], DEALER_ORIGIN[2]]}
          dealDelay={getDealDelay('dealer', i)}
        />
      ))}
      {playerCards.map((card, i) => (
        <CardMesh
          key={`r${roundKey}-player-${i}`}
          card={card}
          position={[PLAYER_ORIGIN[0] + i * CARD_SPREAD, PLAYER_ORIGIN[1], PLAYER_ORIGIN[2]]}
          dealDelay={getDealDelay('player', i)}
        />
      ))}
    </group>
  );
}
