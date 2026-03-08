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
    <group position={[-0.5, 0.07, -0.2]} scale={[1.2, 0.8, 0.8]} rotation={[0, -Math.PI / -3, 1.5]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
