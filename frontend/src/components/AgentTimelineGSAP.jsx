import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCircle, XCircle, Clock, Loader, Cpu } from 'lucide-react';

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
  Supervisor: 'Supervisor',
  TransactionAgent: 'Transaction Agent',
  BehaviourAgent: 'Behaviour Agent',
  AnomalyAgent: 'Anomaly Agent',
  DeviceAgent: 'Device Agent',
  LocationAgent: 'Location Agent',
  PatternAgent: 'Pattern Agent',
  InvestigationAgent: 'Investigation Agent',
  RiskEngine: 'Risk Engine',
};

const AGENT_DESCRIPTIONS = {
  Supervisor: 'Orchestrates the investigation pipeline',
  TransactionAgent: 'Analyzes transaction context and velocity',
  BehaviourAgent: 'Compares against customer baseline',
  AnomalyAgent: 'Detects rule-based anomalies',
  DeviceAgent: 'Discovers device relationships',
  LocationAgent: 'Analyzes location patterns',
  PatternAgent: 'Builds entity relationship graph',
  InvestigationAgent: 'AI-powered investigation reasoning',
  RiskEngine: 'Deterministic risk calculation',
};

export default function AgentTimelineGSAP({ agents = [], loading = false }) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Animate agent items in when they appear
      const items = containerRef.current.querySelectorAll('.agent-item');
      if (items.length > 0) {
        gsap.fromTo(items,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [agents]);

  // Animate the progress line
  useEffect(() => {
    if (!containerRef.current) return;
    const progressLine = containerRef.current.querySelector('.progress-line');
    if (progressLine && agents.length > 0) {
      const progress = Math.min(agents.length / AGENT_ORDER.length, 1);
      gsap.to(progressLine, {
        scaleY: progress,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  }, [agents]);

  const agentMap = new Map(agents.map((a) => [a.agentName, a]));
  const ordered = AGENT_ORDER.map((name) => agentMap.get(name)).filter(Boolean);

  return (
    <div className="card" ref={containerRef}>
      <h3 className="card-header flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent-400" />
        Agent Investigation Timeline
      </h3>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${(ordered.length / AGENT_ORDER.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-surface-500 mt-1">{ordered.length}/{AGENT_ORDER.length} agents completed</p>
      </div>

      <div className="space-y-3">
        {ordered.map((agent) => (
          <div key={agent.agentName} className="agent-item flex items-start gap-3">
            <div className="mt-0.5">
              {agent.status === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {agent.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-400" />}
              {agent.status === 'PARTIAL' && <Clock className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-surface-200">
                  {AGENT_LABELS[agent.agentName] || agent.agentName}
                </span>
                <span className="text-xs text-surface-500 font-mono">{agent.duration}ms</span>
              </div>
              <p className="text-xs text-surface-500 truncate">{agent.summary}</p>
              <p className="text-[10px] text-surface-600 mt-0.5">
                {AGENT_DESCRIPTIONS[agent.agentName]}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Loader className="w-4 h-4 animate-spin text-accent-400" />
            <span>Investigation in progress…</span>
          </div>
        )}
        {!loading && ordered.length === 0 && (
          <p className="text-sm text-surface-500">No agents have run yet. Start an investigation to begin.</p>
        )}
      </div>
    </div>
  );
}
