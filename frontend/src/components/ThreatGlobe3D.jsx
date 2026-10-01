import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// Sample global node locations (lat, lon -> 3D sphere pos)
function latLongToVector3(lat, lon, radius = 2.2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

const LOCATIONS = [
  { name: 'New York (High Risk Tx)', lat: 40.7128, lon: -74.0060, risk: '#ef4444' },
  { name: 'London Hub', lat: 51.5074, lon: -0.1278, risk: '#38bdf8' },
  { name: 'Tokyo Node', lat: 35.6762, lon: 139.6503, risk: '#22c55e' },
  { name: 'Singapore (Suspicious IP)', lat: 1.3521, lon: 103.8198, risk: '#f97316' },
  { name: 'Zurich Bank Node', lat: 47.3769, lon: 8.5417, risk: '#38bdf8' },
  { name: 'Dubai Relay', lat: 25.2048, lon: 55.2708, risk: '#f59e0b' },
  { name: 'Sydney Endpoint', lat: -33.8688, lon: 151.2093, risk: '#22c55e' },
  { name: 'Sao Paulo Anomaly', lat: -23.5505, lon: -46.6333, risk: '#ef4444' },
];

function ConnectionArc({ startPos, endPos, color = '#38bdf8' }) {
  const pointsRef = useRef();

  const curvePoints = useMemo(() => {
    const vStart = new THREE.Vector3(...startPos);
    const vEnd = new THREE.Vector3(...endPos);
    const dist = vStart.distanceTo(vEnd);
    const mid = new THREE.Vector3()
      .addVectors(vStart, vEnd)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(2.2 + dist * 0.25);

    const curve = new THREE.QuadraticBezierCurve3(vStart, mid, vEnd);
    return curve.getPoints(32);
  }, [startPos, endPos]);

  return (
    <Line
      ref={pointsRef}
      points={curvePoints}
      color={color}
      lineWidth={1.2}
      transparent
      opacity={0.6}
    />
  );
}

function GlobeScene() {
  const globeGroupRef = useRef();
  const particlesRef = useRef();

  // Create background starry cyber particles
  const particlePositions = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += 0.003;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y -= 0.001;
    }
  });

  const nodePositions = useMemo(() => {
    return LOCATIONS.map((loc) => ({
      ...loc,
      pos: latLongToVector3(loc.lat, loc.lon, 2.05),
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />

      {/* Cyber Particle Field */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#0ea5e9" transparent opacity={0.4} sizeAttenuation />
      </points>

      <group ref={globeGroupRef}>
        {/* Core Glowing Globe */}
        <Sphere args={[2, 48, 48]}>
          <meshPhongMaterial
            color="#0f172a"
            emissive="#0284c7"
            emissiveIntensity={0.15}
            specular="#38bdf8"
            shininess={30}
            wireframe={true}
            transparent
            opacity={0.35}
          />
        </Sphere>

        {/* Inner Solid Sphere */}
        <Sphere args={[1.96, 32, 32]}>
          <meshStandardMaterial
            color="#030712"
            roughness={0.8}
            metalness={0.5}
          />
        </Sphere>

        {/* Location Markers */}
        {nodePositions.map((node, i) => (
          <group key={i} position={node.pos}>
            <Sphere args={[0.07, 16, 16]}>
              <meshBasicMaterial color={node.risk} />
            </Sphere>
            {/* Halo pulse */}
            <Sphere args={[0.14, 16, 16]}>
              <meshBasicMaterial color={node.risk} transparent opacity={0.35} />
            </Sphere>
          </group>
        ))}

        {/* Connection Arcs */}
        {nodePositions.map((node, i) => {
          if (i === nodePositions.length - 1) return null;
          const target = nodePositions[(i + 2) % nodePositions.length];
          return (
            <ConnectionArc
              key={i}
              startPos={node.pos}
              endPos={target.pos}
              color={node.risk}
            />
          );
        })}
      </group>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
    </>
  );
}

export default function ThreatGlobe3D() {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden bg-gradient-to-b from-surface-950/80 to-surface-900/40 border border-surface-800/80 backdrop-blur-md">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-900/80 border border-surface-700/60 backdrop-blur-md text-xs font-semibold text-accent-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Global AI Telemetry Mesh
      </div>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <GlobeScene />
      </Canvas>
    </div>
  );
}
