import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

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

export default function AgentTimeline({ agents = [], loading = false }) {
  const agentMap = new Map(agents.map((a) => [a.agentName, a]));
  const ordered = AGENT_ORDER.map((name) => agentMap.get(name)).filter(Boolean);

  return (
    <div className="card">
      <h3 className="card-header">Agent Investigation Timeline</h3>
      <div className="space-y-3">
        {ordered.map((agent) => (
          <div key={agent.agentName} className="flex items-start gap-3">
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
                <span className="text-xs text-surface-500">{agent.duration}ms</span>
              </div>
              <p className="text-xs text-surface-500 truncate">{agent.summary}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Loader className="w-4 h-4 animate-spin" />
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
