import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html, Ring } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Shield, Smartphone, MapPin, AlertTriangle, User, Activity, X } from 'lucide-react';

const NODE_COLORS = {
  customer: '#38bdf8',
  transaction: '#a78bfa',
  device: '#f59e0b',
  location: '#22c55e',
  alert: '#ef4444',
  case: '#f97316',
};

const NODE_ICONS = {
  customer: User,
  transaction: Activity,
  device: Smartphone,
  location: MapPin,
  alert: AlertTriangle,
  case: Shield,
};

const NODE_SIZES = {
  customer: 0.6,
  transaction: 0.75,
  device: 0.5,
  location: 0.45,
  alert: 0.5,
  case: 0.65,
};

function Node({ position, color, size, label, sublabel, onClick, isSelected, type }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
      const targetScale = hovered ? 1.35 : isSelected ? 1.25 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      const ringScale = 1 + Math.sin(t * 3) * 0.1;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  return (
    <group position={position}>
      {/* Outer pulse ring for selected/hovered */}
      {(hovered || isSelected) && (
        <Ring ref={ringRef} args={[size * 1.3, size * 1.5, 32]} position={[0, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </Ring>
      )}

      {/* Node Sphere */}
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.9 : 0.4}
          metalness={0.4}
          roughness={0.2}
          wireframe={false}
        />
      </Sphere>

      {/* 3D Label */}
      <Text
        position={[0, -size - 0.35, 0]}
        fontSize={0.24}
        color={hovered || isSelected ? '#ffffff' : '#cbd5e1'}
        anchorX="center"
        anchorY="top"
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Floating Glass Tooltip */}
      {(hovered || isSelected) && (
        <Html distanceFactor={10} position={[0, size + 0.6, 0]} center>
          <div className="bg-surface-950/90 backdrop-blur-md border border-surface-700/80 shadow-2xl rounded-xl px-3.5 py-2 text-center min-w-[120px] pointer-events-none transition-all transform scale-105">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider text-white mb-1" style={{ background: color }}>
              {type}
            </span>
            <p className="text-xs font-bold text-white whitespace-nowrap">{label}</p>
            {sublabel && <p className="text-[10px] text-surface-400 font-mono mt-0.5">{sublabel}</p>}
          </div>
        </Html>
      )}
    </group>
  );
}

function Edge({ start, end, color = '#475569', animated = true }) {
  const pulseRef = useRef();

  const midPoint = useMemo(
    () => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.4, (start[2] + end[2]) / 2],
    [start, end]
  );

  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...midPoint),
        new THREE.Vector3(...end)
      ),
    [start, end, midPoint]
  );

  const curvePoints = useMemo(() => curve.getPoints(24), [curve]);

  useFrame((state) => {
    if (pulseRef.current && animated) {
      const t = (state.clock.elapsedTime * 0.4) % 1;
      const pos = curve.getPoint(t);
      pulseRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      <Line points={curvePoints} color={color} lineWidth={2} transparent opacity={0.65} />
      {animated && (
        <Sphere ref={pulseRef} args={[0.06, 12, 12]}>
          <meshBasicMaterial color={color} />
        </Sphere>
      )}
    </group>
  );
}

function GraphScene({ nodes, edges, selectedNode, onSelectNode }) {
  // Pre-calculate positions on a sphere grid for stability
  const nodePositions = useMemo(() => {
    const posMap = {};
    const count = nodes.length;
    nodes.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 3.5 + (i % 2) * 0.8;
      posMap[node.id] = [
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ];
    });
    return posMap;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[12, 12, 12]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-12, -12, -12]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[0, -10, 5]} intensity={0.5} color="#a78bfa" />

      {edges.map((edge) => {
        const start = nodePositions[edge.source];
        const end = nodePositions[edge.target];
        if (!start || !end) return null;
        const sourceNode = nodes.find((n) => n.id === edge.source);
        return (
          <Edge
            key={edge.id}
            start={start}
            end={end}
            color={NODE_COLORS[sourceNode?.type] || '#475569'}
          />
        );
      })}

      {nodes.map((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return null;
        const isSelected = selectedNode?.id === node.id;
        return (
          <Node
            key={node.id}
            position={pos}
            color={NODE_COLORS[node.type] || '#64748b'}
            size={NODE_SIZES[node.type] || 0.5}
            label={node.data.label}
            sublabel={node.data.sublabel}
            type={node.type}
            isSelected={isSelected}
            onClick={() => onSelectNode(node)}
          />
        );
      })}

      <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.4} />
    </>
  );
}

export default function Graph3D({ nodes = [], edges = [], onNodeClick }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleSelectNode = useCallback(
    (node) => {
      setSelectedNode(node);
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  if (nodes.length === 0) {
    return (
      <div className="card">
        <h3 className="card-header">
          <span>3D Entity Graph</span>
          <span className="text-[10px] text-surface-500 font-normal">Real-time Visualization</span>
        </h3>
        <p className="text-sm text-surface-500 py-8 text-center">No entity relationships discovered yet.</p>
      </div>
    );
  }

  const SelectedIcon = selectedNode ? NODE_ICONS[selectedNode.type] || Activity : null;

  return (
    <div className="card relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
            3D Cyber Entity Matrix
          </h3>
          <p className="text-xs text-surface-400">Interactive multi-dimensional relationship mapping</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-surface-400 bg-surface-800/60 px-3 py-1 rounded-lg border border-surface-700/50">
          <span>{nodes.length} Nodes</span>
          <span>•</span>
          <span>{edges.length} Connections</span>
        </div>
      </div>

      {/* Canvas container */}
      <div className="h-[460px] rounded-xl border border-surface-800/80 overflow-hidden bg-gradient-to-b from-[#030712] via-[#0b1329] to-[#030712] relative group">
        <Canvas camera={{ position: [0, 0, 9], fov: 50 }}>
          <GraphScene
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        </Canvas>

        {/* Floating Controls hint overlay */}
        <div className="absolute bottom-3 left-3 pointer-events-none bg-surface-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface-800 text-[10px] text-surface-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Drag to rotate • Scroll to zoom • Click node for details</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-surface-800/60">
        <div className="flex flex-wrap gap-4">
          {Object.entries(NODE_COLORS).map(([type, color]) => {
            const Icon = NODE_ICONS[type] || Activity;
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs text-surface-400">
                <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: `${color}25`, border: `1px solid ${color}` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                </div>
                <span className="capitalize text-surface-300 font-medium">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Drawer HUD Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mt-4 p-4 rounded-xl bg-surface-800/80 backdrop-blur-xl border border-surface-700/80 shadow-xl relative"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              {SelectedIcon && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${NODE_COLORS[selectedNode.type]}20`,
                    border: `1px solid ${NODE_COLORS[selectedNode.type]}60`,
                  }}
                >
                  <SelectedIcon className="w-5 h-5" style={{ color: NODE_COLORS[selectedNode.type] }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white" style={{ background: NODE_COLORS[selectedNode.type] }}>
                    {selectedNode.type}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{selectedNode.data.label}</h4>
                </div>
                {selectedNode.data.sublabel && (
                  <p className="text-xs font-mono text-surface-400 mt-1">{selectedNode.data.sublabel}</p>
                )}
                {selectedNode.data.details && (
                  <div className="mt-3 p-2.5 rounded-lg bg-surface-900/80 border border-surface-800 font-mono text-xs text-surface-300 overflow-x-auto max-h-36">
                    <pre>{JSON.stringify(selectedNode.data.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
