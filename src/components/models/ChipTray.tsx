import { useMemo } from 'react';
import * as THREE from 'three';
import { PLAYER_DENOMS, DEALER_DENOMS } from '../../game/constants';

const CHIP_RADIUS = 0.024;
const CHIP_HEIGHT = 0.003;
const CHIP_GAP = 0.001;
const DEALER_STACK_SPACING = 0.06;
const MAX_VISUAL_CHIPS = 20;
const DEALER_STACK_COUNT = 10;

/**
 * Break a chip total into a visually balanced denomination mix.
 * Each denomination takes at most half the remaining value,
 * forcing distribution across all denoms. Smallest absorbs the rest.
 */
export function breakdownChips(total: number): { denom: number; count: number }[] {
  const result: { denom: number; count: number }[] = [];
  let remaining = total;

  for (let i = 0; i < PLAYER_DENOMS.length; i++) {
    const denom = PLAYER_DENOMS[i].value;
    if (remaining < denom) continue;

    if (i === PLAYER_DENOMS.length - 1) {
      result.push({ denom, count: Math.floor(remaining / denom) });
      remaining = remaining % denom;
    } else {
      const maxValue = Math.floor(remaining / 2);
      const count = Math.max(1, Math.floor(maxValue / denom));
      result.push({ denom, count });
      remaining -= count * denom;
    }
  }

  return result;
}

// --- Texture generation (cached) ---

const faceCache = new Map<string, THREE.CanvasTexture>();

function getChipFaceTexture(color: string, label: string): THREE.CanvasTexture {
  const key = `${color}-${label}`;
  if (faceCache.has(key)) return faceCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = r * 0.03;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#f2ede0';
  ctx.fill();

  const fontSize = label.length > 3 ? r * 0.32 : r * 0.42;
  ctx.font = `bold ${fontSize}px serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);

  const tex = new THREE.CanvasTexture(canvas);
  faceCache.set(key, tex);
  return tex;
}

// --- Stack component ---

function ChipStack({ color, label, count, position, rotation }: {
  color: string;
  label: string;
  count: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const visualCount = Math.min(count, MAX_VISUAL_CHIPS);
  const faceTexture = useMemo(() => getChipFaceTexture(color, label), [color, label]);

  const sideMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 }),
    [color]
  );
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.4, metalness: 0 }),
    [faceTexture]
  );

  if (visualCount <= 0) return null;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: visualCount }).map((_, i) => (
        <mesh
          key={i}
          position={[0, i * (CHIP_HEIGHT + CHIP_GAP), 0]}
          castShadow
          receiveShadow
          material={[sideMat, faceMat, faceMat]}
        >
          <cylinderGeometry args={[CHIP_RADIUS, CHIP_RADIUS, CHIP_HEIGHT, 32]} />
        </mesh>
      ))}
    </group>
  );
}

// --- Dealer's bank: static decorative chip tray ---

export function ChipTray() {
  const totalWidth = (DEALER_DENOMS.length - 1) * DEALER_STACK_SPACING;

  return (
    <group position={[-0.121, 0.052, -0.055]} rotation={[Math.PI / 2, 0, 0]}>
      {DEALER_DENOMS.map((chip, i) => (
        <ChipStack
          key={chip.label}
          color={chip.color}
          label={chip.label}
          count={DEALER_STACK_COUNT}
          position={[i * DEALER_STACK_SPACING - totalWidth / 2, 0, 0]}
        />
      ))}
    </group>
  );
}

// --- Player's chips: dynamic stacks at player's edge ---

interface PlayerChipsProps {
  chips: number;
}

export function PlayerChips({ chips }: PlayerChipsProps) {
  const stacks = useMemo(() => breakdownChips(chips), [chips]);

  if (chips <= 0) return null;

  // Build a single combined stack: each denom's chips sit on top of the previous
  let yOffset = 0;
  const stackEntries = stacks.map(({ denom, count }) => {
    const denomInfo = PLAYER_DENOMS.find(d => d.value === denom)!;
    const entry = { denom, count, color: denomInfo.color, label: denomInfo.label, y: yOffset };
    yOffset += Math.min(count, MAX_VISUAL_CHIPS) * (CHIP_HEIGHT + CHIP_GAP);
    return entry;
  });

  return (
    <group position={[-0.166, 0.069, -1.33]} rotation={[0, Math.PI / 16, Math.PI / 2]}>
      {stackEntries.map(({ denom, count, color, label, y }) => (
        <ChipStack
          key={denom}
          color={color}
          label={label}
          count={count}
          position={[0, y, 0]}
        />
      ))}
    </group>
  );
}

// --- Bet chips: in the middle during a round ---

interface BetChipsProps {
  bet: number;
}

export function BetChips({ bet }: BetChipsProps) {
  const stacks = useMemo(() => breakdownChips(bet), [bet]);

  if (bet <= 0 || stacks.length === 0) return null;

  let yOffset = 0;
  const stackEntries = stacks.map(({ denom, count }) => {
    const denomInfo = PLAYER_DENOMS.find(d => d.value === denom)!;
    const entry = { denom, count, color: denomInfo.color, label: denomInfo.label, y: yOffset };
    yOffset += Math.min(count, MAX_VISUAL_CHIPS) * (CHIP_HEIGHT + CHIP_GAP);
    return entry;
  });

  return (
    <group position={[0, 0.069, -0.85]}>
      {stackEntries.map(({ denom, count, color, label, y }) => (
        <ChipStack
          key={denom}
          color={color}
          label={label}
          count={count}
          position={[0, y, 0]}
        />
      ))}
    </group>
  );
}
