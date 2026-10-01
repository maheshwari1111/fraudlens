import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Eye, RefreshCw, Layers } from 'lucide-react';
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
  customer: 0.65,
  transaction: 0.85,
  device: 0.55,
  location: 0.45,
  alert: 0.5,
  case: 0.6,
};

function Node3D({ position, color, size, label, sublabel, onClick, isSelected, activeFilter }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      const targetScale = hovered ? 1.35 : isSelected ? 1.25 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Outer Pulse Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 1.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={hovered || isSelected ? 0.8 : 0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Main Node Sphere */}
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
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
          metalness={0.4}
          roughness={0.2}
        />
      </Sphere>

      {/* HTML Tooltip on Hover */}
      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, size + 0.6, 0]} center>
          <div className="bg-surface-950/95 border border-surface-700/80 backdrop-blur-md rounded-xl px-3.5 py-2 text-center min-w-[120px] shadow-neon-accent/30 pointer-events-none">
            <p className="text-xs font-bold text-white font-mono">{label}</p>
            {sublabel && <p className="text-[10px] text-surface-400 mt-0.5">{sublabel}</p>}
          </div>
        </Html>
      )}

      {/* 3D Label */}
      <Text
        position={[0, -size - 0.35, 0]}
        fontSize={0.22}
        color="#cbd5e1"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </group>
  );
}

function Edge3D({ start, end, color = '#475569', animated = true }) {
  const lineRef = useRef();

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

  const curvePoints = useMemo(() => curve.getPoints(24), [curve]);

  useFrame((state) => {
    if (lineRef.current && animated) {
      const t = (state.clock.elapsedTime * 0.4) % 1;
      const pos = curve.getPoint(t);
      lineRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      <Line points={curvePoints} color={color} lineWidth={1.8} transparent opacity={0.65} />
      {animated && (
        <Sphere ref={lineRef} args={[0.05, 12, 12]}>
          <meshBasicMaterial color={color} />
        </Sphere>
      )}
    </group>
  );
}

function ForceLayout({ nodes, edges, onSelectNode, selectedNode, activeFilter }) {
  const [positions, setPositions] = useState({});

  useMemo(() => {
    const pos = {};
    nodes.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / nodes.length);
      const theta = Math.sqrt(nodes.length * Math.PI) * phi;
      const r = 3.2 + Math.random() * 1.5;
      pos[node.id] = [
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ];
    });
    setPositions(pos);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (activeFilter === 'all') return nodes;
    return nodes.filter((n) => n.type === activeFilter);
  }, [nodes, activeFilter]);

  return (
    <group>
      {edges.map((edge) => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        if (!start || !end) return null;
        return (
          <Edge3D
            key={edge.id}
            start={start}
            end={end}
            color={NODE_COLORS[nodes.find((n) => n.id === edge.source)?.type] || '#475569'}
          />
        );
      })}

      {filteredNodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <Node3D
            key={node.id}
            position={pos}
            color={NODE_COLORS[node.type] || '#64748b'}
            size={NODE_SIZES[node.type] || 0.5}
            label={node.data.label}
            sublabel={node.data.sublabel}
            isSelected={selectedNode?.id === node.id}
            onClick={() => onSelectNode(node)}
          />
        );
      })}
    </group>
  );
}

export default function Graph3D({ nodes = [], edges = [], onNodeClick }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  return (
    <div className="card-glass-glow relative flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="card-header mb-0 flex items-center gap-2 text-white font-mono">
            <Layers className="w-4 h-4 text-cyber-neon" />
            3D Entity Relationship Graph
          </h3>
          <p className="text-xs text-surface-400">Interactive 3D spatial mesh of suspicious entities</p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-accent-500 text-white shadow-neon-accent'
                : 'bg-surface-800/80 text-surface-400 hover:text-surface-200'
            }`}
          >
            All ({nodes.length})
          </button>
          {Object.keys(NODE_COLORS).map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeFilter === type
                  ? 'bg-surface-700 text-white border border-surface-600'
                  : 'bg-surface-900/60 text-surface-400 hover:text-surface-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="w-full h-[450px] rounded-xl border border-surface-800 overflow-hidden bg-surface-950/90 relative shadow-inner">
        <Canvas camera={{ position: [0, 0, 8.5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#38bdf8" />
          <ForceLayout
            nodes={nodes}
            edges={edges}
            onSelectNode={handleNodeClick}
            selectedNode={selectedNode}
            activeFilter={activeFilter}
          />
          <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.5} dampingFactor={0.05} />
        </Canvas>
      </div>

      {/* Selected Node Details Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 rounded-xl bg-surface-950/90 border border-accent-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
          >
            <div>
              <span className="text-xs font-mono text-accent-400 uppercase tracking-widest">{selectedNode.type} Node</span>
              <p className="text-sm font-bold text-white font-mono mt-0.5">{selectedNode.data.label}</p>
              {selectedNode.data.sublabel && (
                <p className="text-xs text-surface-400">{selectedNode.data.sublabel}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-surface-400 hover:text-surface-200 underline"
            >
              Close Inspector
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
