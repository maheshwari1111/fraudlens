import { useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { User, ArrowLeftRight, Smartphone, MapPin, AlertTriangle, Briefcase } from 'lucide-react';

const NODE_CONFIG = {
  customer: { icon: User, color: '#38bdf8', label: 'Customer' },
  transaction: { icon: ArrowLeftRight, color: '#a78bfa', label: 'Transaction' },
  device: { icon: Smartphone, color: '#f59e0b', label: 'Device' },
  location: { icon: MapPin, color: '#22c55e', label: 'Location' },
  alert: { icon: AlertTriangle, color: '#ef4444', label: 'Alert' },
  case: { icon: Briefcase, color: '#f97316', label: 'Case' },
};

function CustomNode({ data, type }) {
  const config = NODE_CONFIG[type] || NODE_CONFIG.customer;
  const Icon = config.icon;
  return (
    <div
      className="px-3 py-2 rounded-lg border-2 bg-surface-900 min-w-[120px] text-center"
      style={{ borderColor: config.color }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        <span className="text-[10px] uppercase tracking-wider text-surface-500">{config.label}</span>
      </div>
      <p className="text-xs font-semibold text-surface-100 truncate">{data.label}</p>
      {data.sublabel && <p className="text-[10px] text-surface-500 truncate">{data.sublabel}</p>}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function RelationshipGraph({ nodes = [], edges = [], onNodeClick }) {
  const rfNodes = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: n.data,
        className: `node-${n.type}`,
      })),
    [nodes]
  );

  const rfEdges = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#475569', strokeWidth: 1.5 },
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
      })),
    [edges]
  );

  const handleNodeClick = useCallback((_, node) => {
    const original = nodes.find((n) => n.id === node.id);
    if (original && onNodeClick) onNodeClick(original);
  }, [nodes, onNodeClick]);

  if (nodes.length === 0) {
    return (
      <div className="card">
        <h3 className="card-header">Relationship Graph</h3>
        <p className="text-sm text-surface-500">No relationships discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-header">Relationship Graph</h3>
      <div className="h-[400px] rounded-lg border border-surface-800 overflow-hidden">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#1e293b" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => NODE_CONFIG[n.className?.replace('node-', '')]?.color || '#64748b'}
            maskColor="rgba(2, 6, 23, 0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
