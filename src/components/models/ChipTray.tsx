import { useMemo } from 'react';
import * as THREE from 'three';

const DENOMINATIONS = [
  { value: '5000', color: '#8b4020' },
  { value: '1000', color: '#c8a000' },
  { value: '500',  color: '#6050a8' },
  { value: '100',  color: '#2a2a2a' },
  { value: '25',   color: '#1e6b1e' },
  { value: '5',    color: '#cc2020' },
  { value: '1',    color: '#1e8fcc' },
  { value: '0.25', color: '#bab3a8' },
];

const CHIP_RADIUS = 0.024;
const CHIP_HEIGHT = 0.003;
const CHIP_GAP = 0.001;
const STACK_COUNT = 5;
const STACK_SPACING = 0.06;

function makeChipFaceTexture(color: string, value: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  // Chip color background
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Outer white ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  // Inner ring (chip color, thinner)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = r * 0.03;
  ctx.stroke();

  // Center medallion
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#f2ede0';
  ctx.fill();

  // Denomination text
  const fontSize = value.length > 3 ? r * 0.32 : r * 0.42;
  ctx.font = `bold ${fontSize}px serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, cx, cy);

  return new THREE.CanvasTexture(canvas);
}

function ChipStack({ color, value, position }: { color: string; value: string; position: [number, number, number] }) {
  const faceTexture = useMemo(() => makeChipFaceTexture(color, value), [color, value]);

  const sideMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 }),
    [color]
  );
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.4, metalness: 0 }),
    [faceTexture]
  );

  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {Array.from({ length: STACK_COUNT }).map((_, i) => (
        <mesh
          key={i}
          position={[0, i * (CHIP_HEIGHT + CHIP_GAP), 0]}
          castShadow={true}
          receiveShadow={true}
          material={[sideMat, faceMat, faceMat]}
        >
          <cylinderGeometry args={[CHIP_RADIUS, CHIP_RADIUS, CHIP_HEIGHT, 32]} />
        </mesh>
      ))}
    </group>
  );
}

export function ChipTray() {
  const totalWidth = (DENOMINATIONS.length - 1) * STACK_SPACING;

  return (
    <group position={[-0.121, 0.052, -0.043]}>
      {DENOMINATIONS.map((chip, i) => (
        <ChipStack
          key={chip.value}
          color={chip.color}
          value={chip.value}
          position={[i * STACK_SPACING - totalWidth / 2, 0, 0]}
        />
      ))}
    </group>
  );
}
