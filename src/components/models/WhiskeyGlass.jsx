import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = '/models/glass_whisky_test/scene.gltf';

export function WhiskeyGlass() {
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
    <group position={[-1.5, 0.85, 0.8]} scale={[0.04, 0.04, 0.04]} rotation={[0, Math.PI / 5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
