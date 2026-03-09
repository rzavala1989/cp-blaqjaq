import { Backdrop } from '@react-three/drei';

export function CasinoBackdrop() {
  return (
    <Backdrop
      floor={0.5}
      segments={20}
      position={[0, -1.2, -3]}
      scale={[9, 6, 1]}
      receiveShadow
    >
      <meshStandardMaterial color="#0a0705" roughness={0.9} metalness={0} />
    </Backdrop>
  );
}
