import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleConstellation({ count = 150 }) {
  const pointsRef = useRef();
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#38bdf8');
    const purple = new THREE.Color('#818cf8');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const mixed = cyan.clone().lerp(purple, Math.random());
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingGeometry() {
  const mesh1 = useRef();
  const mesh2 = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mesh1.current) {
      mesh1.current.rotation.x = t * 0.2;
      mesh1.current.rotation.y = t * 0.15;
      mesh1.current.position.y = Math.sin(t * 0.5) * 0.5;
    }
    if (mesh2.current) {
      mesh2.current.rotation.x = -t * 0.15;
      mesh2.current.rotation.z = t * 0.2;
      mesh2.current.position.y = Math.cos(t * 0.4) * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={mesh1} position={[-8, 4, -8]}>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh ref={mesh2} position={[9, -5, -6]}>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#a78bfa" wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export default function CyberBackground3D() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.2} />
        <ParticleConstellation />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
}
