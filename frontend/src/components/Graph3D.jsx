import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

const NODE_COLORS = {
  customer: '#38bdf8',
  transaction: '#a78bfa',
  device: '#f59e0b',
  location: '#22c55e',
  alert: '#ef4444',
  case: '#f97316',
};

const NODE_SIZES = {
  customer: 0.6,
  transaction: 0.8,
  device: 0.5,
  location: 0.4,
  alert: 0.45,
  case: 0.55,
};

function Node({ position, color, size, label, sublabel, onClick, isSelected }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      const scale = hovered ? 1.3 : isSelected ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.6 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </Sphere>
      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, size + 0.5, 0]} center>
          <div className="bg-surface-900/95 border border-surface-700 rounded-lg px-3 py-2 text-center min-w-[100px] pointer-events-none">
            <p className="text-xs font-semibold text-white">{label}</p>
            {sublabel && <p className="text-[10px] text-surface-400">{sublabel}</p>}
          </div>
        </Html>
      )}
      <Text
        position={[0, -size - 0.3, 0]}
        fontSize={0.22}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

function Edge({ start, end, color = '#475569', animated = true }) {
  const lineRef = useRef();
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  const midPoint = useMemo(() => [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.3,
    (start[2] + end[2]) / 2,
  ], [start, end]);

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(...midPoint),
    new THREE.Vector3(...end),
  ), [start, end, midPoint]);

  const curvePoints = useMemo(() => curve.getPoints(20), [curve]);

  useFrame((state) => {
    if (lineRef.current && animated) {
      const t = (state.clock.elapsedTime * 0.3) % 1;
      const pos = curve.getPoint(t);
      lineRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      <Line points={curvePoints} color={color} lineWidth={1.5} transparent opacity={0.6} />
      {animated && (
        <Sphere ref={lineRef} args={[0.04, 8, 8]}>
          <meshBasicMaterial color={color} />
        </Sphere>
      )}
    </group>
  );
}

function ForceLayout({ nodes, edges }) {
  const groupRef = useRef();
  const [positions, setPositions] = useState({});

  // Initialize positions in a sphere
  useMemo(() => {
    const pos = {};
    nodes.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;
      const r = 3 + Math.random() * 2;
      pos[node.id] = [
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ];
    });
    setPositions(pos);
  }, [nodes]);

  // Simple force simulation
  useFrame(() => {
    if (Object.keys(positions).length === 0) return;
    const newPos = { ...positions };
    const repulsion = 0.5;
    const attraction = 0.02;
    const centerGravity = 0.01;

    for (const node of nodes) {
      const p = newPos[node.id];
      if (!p) continue;

      // Repulsion from other nodes
      for (const other of nodes) {
        if (node.id === other.id) continue;
        const op = newPos[other.id];
        if (!op) continue;
        const dx = p[0] - op[0];
        const dy = p[1] - op[1];
        const dz = p[2] - op[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
        const force = repulsion / (dist * dist);
        newPos[node.id] = [
          p[0] + (dx / dist) * force,
          p[1] + (dy / dist) * force,
          p[2] + (dz / dist) * force,
        ];
      }

      // Attraction along edges
      for (const edge of edges) {
        let otherId = null;
        if (edge.source === node.id) otherId = edge.target;
        else if (edge.target === node.id) otherId = edge.source;
        if (!otherId) continue;
        const op = newPos[otherId];
        if (!op) continue;
        const dx = op[0] - p[0];
        const dy = op[1] - p[1];
        const dz = op[2] - p[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
        newPos[node.id] = [
          p[0] + dx * attraction,
          p[1] + dy * attraction,
          p[2] + dz * attraction,
        ];
      }

      // Center gravity
      newPos[node.id] = [
        p[0] - p[0] * centerGravity,
        p[1] - p[1] * centerGravity,
        p[2] - p[2] * centerGravity,
      ];
    }

    setPositions(newPos);
  });

  return (
    <group ref={groupRef}>
      {edges.map((edge) => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        if (!start || !end) return null;
        return (
          <Edge
            key={edge.id}
            start={start}
            end={end}
            color={NODE_COLORS[nodes.find((n) => n.id === edge.source)?.type] || '#475569'}
          />
        );
      })}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <Node
            key={node.id}
            position={pos}
            color={NODE_COLORS[node.type] || '#64748b'}
            size={NODE_SIZES[node.type] || 0.5}
            label={node.data.label}
            sublabel={node.data.sublabel}
          />
        );
      })}
    </group>
  );
}

export default function Graph3D({ nodes = [], edges = [], onNodeClick }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  if (nodes.length === 0) {
    return (
      <div className="card">
        <h3 className="card-header">3D Relationship Graph</h3>
        <p className="text-sm text-surface-500">No relationships discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-header">3D Relationship Graph</h3>
      <div className="h-[450px] rounded-xl border border-surface-800 overflow-hidden bg-surface-950">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />
          <ForceLayout nodes={nodes} edges={edges} />
          <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-surface-400">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
      {selectedNode && (
        <div className="mt-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
          <p className="text-sm font-medium text-surface-200">{selectedNode.data.label}</p>
          <pre className="text-xs text-surface-400 mt-1 overflow-x-auto">
            {JSON.stringify(selectedNode.data.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
