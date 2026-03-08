import { Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

import { Lighting } from './Lighting';
import { BlackjackTable } from './models/BlackjackTable';
import { WhiskeyGlass } from './models/WhiskeyGlass';
import { Colt1911 } from './models/Colt1911';
import { CardDeck } from './CardDeck';

function CameraIntro({ onComplete }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 16, 20);
    camera.lookAt(0, 0, 0);

    const proxy = { angle: 0, y: 16, r: 20 };
    gsap.to(proxy, {
      angle: Math.PI,
      y: 0.5,
      r: 1.8,
      duration: 3.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(
          Math.sin(proxy.angle) * proxy.r,
          proxy.y,
          Math.cos(proxy.angle) * proxy.r
        );
        camera.lookAt(0, 0, 0);
      },
      onComplete: () => onComplete(),
    });
  }, [camera, onComplete]);

  return null;
}

export default function Scene() {
  const [controlsReady, setControlsReady] = useState(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      camera={{
        fov: 60,
        near: 0.1,
        far: 100,
        position: [0, 16, 20],
      }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', 0.04]} />

      <CameraIntro onComplete={() => setControlsReady(true)} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
        enabled={controlsReady}
      />

      <Lighting />

      <Suspense fallback={null}>
        <BlackjackTable />
        <WhiskeyGlass />
        <Colt1911 />

      </Suspense>

      <ContactShadows position={[0, 0, 0]} opacity={0.6} blur={2} />
      <Environment preset="night" />

      <EffectComposer>
        <Bloom luminanceThreshold={0.85} intensity={0.4} radius={0.5} />
        <Vignette darkness={0.6} offset={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
