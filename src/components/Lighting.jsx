export function Lighting() {
  return (
    <>
      <spotLight
        position={[0, 8, 0]}
        color="#ffd97d"
        intensity={3}
        angle={Math.PI / 7}
        penumbra={0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <ambientLight color="#0a0a14" intensity={0.3} />
      <pointLight position={[-4, 2, -2]} color="#ff6b35" intensity={0.4} />
      <pointLight position={[4, 1, 2]} color="#1a1a3e" intensity={0.2} />
    </>
  );
}
