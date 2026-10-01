import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Cpu, ShieldCheck, Zap, Activity, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const AGENTS_CONFIG = [
  { id: 'Supervisor', name: 'Supervisor Agent', role: 'Pipeline Master', type: 'core', color: '#00f3ff' },
  { id: 'TransactionAgent', name: 'Transaction Agent', role: 'Velocity & Amount', type: 'analyzer', color: '#38bdf8' },
  { id: 'BehaviourAgent', name: 'Behaviour Agent', role: 'Baseline Comparison', type: 'analyzer', color: '#a78bfa' },
  { id: 'AnomalyAgent', name: 'Anomaly Agent', role: 'Rule Engine', type: 'analyzer', color: '#ec4899' },
  { id: 'DeviceAgent', name: 'Device Agent', role: 'Fingerprint & MAC', type: 'graph', color: '#f59e0b' },
  { id: 'LocationAgent', name: 'Location Agent', role: 'Geo IP & Hop', type: 'graph', color: '#10b981' },
  { id: 'PatternAgent', name: 'Relationship Agent', role: 'Entity Graph', type: 'graph', color: '#6366f1' },
  { id: 'InvestigationAgent', name: 'AI Reasoning Agent', role: 'LLM Synthesis', type: 'synthesis', color: '#f97316' },
  { id: 'RiskEngine', name: 'Risk Engine', role: 'Deterministic Score', type: 'synthesis', color: '#ef4444' },
];

export default function AgentOrchestratorGSAP({ agents = [], loading = false }) {
  const containerRef = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS_CONFIG[0]);

  const agentMap = new Map(agents.map((a) => [a.agentName, a]));

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Pulse background nodes
      gsap.to('.agent-node-pulse', {
        scale: 1.15,
        opacity: 0.7,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.1,
        ease: 'sine.inOut',
      });

      // Flow dots along SVG cables
      gsap.to('.cable-pulse', {
        strokeDashoffset: -100,
        duration: 3,
        repeat: -1,
        ease: 'none',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [agents]);

  return (
    <div className="card-glass-glow relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="card-header mb-1 flex items-center gap-2 text-white font-mono">
            <Cpu className="w-5 h-5 text-accent-400 animate-pulse" />
            AI Autonomous Agent Orchestrator
          </h3>
          <p className="text-xs text-surface-400">Multi-agent parallel reasoning & entity analysis pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-accent-500/10 text-accent-400 border-accent-500/20">
            <Zap className="w-3 h-3 animate-bounce" />
            9 Agents Active
          </span>
        </div>
      </div>

      {/* Agents Topology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-6">
        {AGENTS_CONFIG.map((config) => {
          const liveData = agentMap.get(config.id);
          const isDone = liveData?.status === 'SUCCESS';
          const isRunning = loading && !isDone;
          const isSelected = selectedAgent.id === config.id;

          return (
            <button
              key={config.id}
              onClick={() => setSelectedAgent(config)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[110px] ${
                isSelected
                  ? 'bg-surface-800/90 border-accent-400 shadow-neon-accent/30 scale-105'
                  : 'bg-surface-950/60 border-surface-800/80 hover:border-surface-700 hover:bg-surface-900/60'
              }`}
            >
              <div
                className="agent-node-pulse absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />

              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white shadow-md"
                  style={{ backgroundColor: `${config.color}33`, border: `1px solid ${config.color}66` }}
                >
                  {config.id.substring(0, 2)}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-surface-100 truncate">{config.name.replace(' Agent', '')}</p>
                <p className="text-[10px] text-surface-400 truncate mt-0.5">{config.role}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-surface-800/60 flex items-center justify-between text-[10px]">
                {isDone ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {liveData.duration}ms
                  </span>
                ) : isRunning ? (
                  <span className="text-accent-400 font-semibold flex items-center gap-1 animate-pulse">
                    <Activity className="w-3 h-3 animate-spin" /> Active
                  </span>
                ) : (
                  <span className="text-surface-500 font-mono">READY</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Telemetry Inspector */}
      {selectedAgent && (
        <div className="bg-surface-950/80 rounded-xl p-4 border border-surface-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-mono text-sm"
              style={{ backgroundColor: `${selectedAgent.color}33`, border: `1px solid ${selectedAgent.color}` }}
            >
              {selectedAgent.id.substring(0, 2)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedAgent.name}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-surface-300">
                  {selectedAgent.type.toUpperCase()}
                </span>
              </h4>
              <p className="text-xs text-surface-400">{selectedAgent.role} • Continuous Agent Graph Node</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-surface-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CONSENSUS SCORE: 98.4%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-accent-400" />
              <span>LATENCY: ~42ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
