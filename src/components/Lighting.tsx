export function Lighting() {
  return (
    <>
      <spotLight
        position={[0, 8, 0]}
        color="#fff5e0"
        intensity={30}
        angle={Math.PI / 6}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <hemisphereLight args={['#ffffff', '#ffffff', 1.4]} />
      <pointLight position={[-3, 4, 3]} color="#ffffff" intensity={4} />
      <pointLight position={[4, 3, -3]} color="#ffffff" intensity={2} />
    </>
  );
}
