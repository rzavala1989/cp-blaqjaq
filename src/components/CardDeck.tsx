export function CardDeck() {
  return (
    <group position={[1.8, 0.84, 0]} rotation={[0, Math.PI / 12, 0]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, i * 0.012, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.01, 1.0]} />
          <meshStandardMaterial color="#8b0000" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
