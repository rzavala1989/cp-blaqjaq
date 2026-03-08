import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = '/models/blackjack_table/scene.gltf';

export function BlackjackTable() {
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
    <group position={[0, 0, 0]} scale={[0.005, 0.005, 0.005]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
