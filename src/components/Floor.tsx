import { MeshReflectorMaterial } from '@react-three/drei';

export function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <MeshReflectorMaterial
        blur={[50, 25]}
        resolution={2048}
        mixBlur={0.05}
        mixStrength={90}
        roughness={0.05}
        depthScale={1.5}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#080808"
        metalness={0.9}
      />
    </mesh>
  );
}
