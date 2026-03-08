import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = '/models/colt_m1911/scene.gltf';

export function Colt1911() {
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group position={[1.5, 0.85, -0.8]} scale={[0.5, 0.5, 0.5]} rotation={[0, -Math.PI / 6, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
