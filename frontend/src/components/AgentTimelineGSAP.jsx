import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Loader2, Cpu, ChevronRight, Zap, ShieldAlert } from 'lucide-react';

const AGENT_ORDER = [
  'Supervisor',
  'TransactionAgent',
  'BehaviourAgent',
  'AnomalyAgent',
  'DeviceAgent',
  'LocationAgent',
  'PatternAgent',
  'InvestigationAgent',
  'RiskEngine',
];

const AGENT_LABELS = {
  Supervisor: 'Master Orchestrator',
  TransactionAgent: 'Transaction Velocity Agent',
  BehaviourAgent: 'Behavioral Baseline Agent',
  AnomalyAgent: 'Rules Anomaly Agent',
  DeviceAgent: 'Device Fingerprint Agent',
  LocationAgent: 'Geo-Spatial Agent',
  PatternAgent: 'Graph Network Agent',
  InvestigationAgent: 'AI Reasoning Agent',
  RiskEngine: 'Deterministic Risk Engine',
};

const AGENT_DESCRIPTIONS = {
  Supervisor: 'Orchestrates investigation pipeline and coordinates specialized AI agents',
  TransactionAgent: 'Analyzes transaction amounts, merchant categories, and velocity spikes',
  BehaviourAgent: 'Compares active transaction against 90-day customer baseline profile',
  AnomalyAgent: 'Evaluates deterministic anti-fraud rules & suspicious indicators',
  DeviceAgent: 'Discovers device reuse, fingerprint hashes, and IP proxy risk',
  LocationAgent: 'Detects impossible travel anomalies and geo-spatial variance',
  PatternAgent: 'Constructs entity relationship graph across shared cards & devices',
  InvestigationAgent: 'Synthesizes findings using LLM multi-agent reasoning model',
  RiskEngine: 'Calculates final composite risk score and recommended action',
};

export default function AgentTimelineGSAP({ agents = [], loading = false }) {
  const containerRef = useRef(null);
  const [expandedAgent, setExpandedAgent] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const items = containerRef.current.querySelectorAll('.agent-card-item');
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -30, scale: 0.95 },
          { opacity: 1, x: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.4)' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [agents]);

  const agentMap = new Map(agents.map((a) => [a.agentName, a]));
  const ordered = AGENT_ORDER.map((name) => agentMap.get(name)).filter(Boolean);
  const completionPercentage = Math.round((ordered.length / AGENT_ORDER.length) * 100);

  return (
    <div className="card relative overflow-hidden" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-500/20 border border-accent-500/40 flex items-center justify-center text-accent-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Multi-Agent Neural Pipeline</h3>
            <p className="text-xs text-surface-400">Autonomous investigation workflow execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-accent-400 bg-accent-500/10 px-3 py-1 rounded-lg border border-accent-500/20">
            {completionPercentage}% Executed
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-surface-800/80 rounded-full overflow-hidden p-0.5 border border-surface-700/50">
          <div
            className="h-full bg-gradient-to-r from-accent-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(56,189,248,0.5)] relative"
            style={{ width: `${completionPercentage}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-xs animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-surface-400 mt-1.5 font-mono">
          <span>Supervisor Triggered</span>
          <span>{ordered.length} / {AGENT_ORDER.length} Agents Finalized</span>
        </div>
      </div>

      {/* Agents Timeline List */}
      <div className="space-y-3 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-800">
        {ordered.map((agent, idx) => {
          const isExpanded = expandedAgent === agent.agentName;
          return (
            <div
              key={agent.agentName}
              className="agent-card-item relative pl-10 group"
            >
              {/* Timeline Bullet */}
              <div className="absolute left-2.5 top-3 -translate-x-1/2 w-6 h-6 rounded-full bg-surface-900 border-2 border-surface-700 flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 group-hover:border-accent-400">
                {agent.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {agent.status === 'FAILED' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                {agent.status === 'PARTIAL' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
              </div>

              {/* Agent Box */}
              <div
                onClick={() => setExpandedAgent(isExpanded ? null : agent.agentName)}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isExpanded
                    ? 'bg-surface-800/90 border-accent-500/50 shadow-lg'
                    : 'bg-surface-900/60 border-surface-800/80 hover:bg-surface-800/50 hover:border-surface-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold text-surface-400">0{idx + 1}</span>
                    <span className="text-sm font-bold text-white truncate">
                      {AGENT_LABELS[agent.agentName] || agent.agentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-950/60 text-surface-400 border border-surface-800">
                      {agent.duration}ms
                    </span>
                    <ChevronRight className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-accent-400' : ''}`} />
                  </div>
                </div>

                <p className="text-xs text-surface-400 mt-1 truncate">{agent.summary}</p>

                {/* Expandable Agent Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-surface-700/60 space-y-2 text-xs"
                    >
                      <p className="text-surface-300 leading-relaxed font-sans">
                        <span className="font-semibold text-accent-400">Agent Purpose: </span>
                        {AGENT_DESCRIPTIONS[agent.agentName]}
                      </p>
                      {agent.details && (
                        <div className="p-2.5 rounded-lg bg-surface-950/80 font-mono text-[11px] text-surface-300 border border-surface-800 overflow-x-auto max-h-40">
                          <pre>{JSON.stringify(agent.details, null, 2)}</pre>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="pl-10 flex items-center gap-3 py-4 text-sm text-accent-400 font-medium animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Autonomous agent pipeline analyzing telemetry...</span>
          </div>
        )}

        {!loading && ordered.length === 0 && (
          <p className="text-sm text-surface-500 py-6 text-center">No agent telemetry recorded yet.</p>
        )}
      </div>
    </div>
  );
}
