import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const coneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color('#ffd97d') },
    uOpacity: { value: 0.06 },
  },
  vertexShader: `
    varying float vY;
    void main() {
      vY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vY;
    void main() {
      float t = (vY + 4.5) / 9.0;
      float fade = pow(t, 0.6) * (1.0 - pow(1.0 - t, 3.0));
      gl_FragColor = vec4(uColor, uOpacity * fade);
    }
  `,
  transparent: true,
  depthWrite: false,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
});

export function VolumetricLight() {
  const coneRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coneRef.current) {
      const t = clock.getElapsedTime();
      coneMaterial.uniforms.uOpacity.value =
        0.06 + Math.sin(t * 1.3) * 0.008 + Math.sin(t * 3.7) * 0.003;
    }
  });

  return (
    <group position={[0, 8, 0]}>
      <mesh ref={coneRef} position={[0, -4.5, 0]} material={coneMaterial}>
        <coneGeometry args={[3.2, 9, 48, 1, true]} />
      </mesh>

      <Sparkles
        count={50}
        scale={[3, 7, 3]}
        position={[0, -4, 0]}
        size={0.5}
        speed={0.1}
        opacity={0.2}
        color="#ffd97d"
        noise={0.4}
      />
    </group>
  );
}
