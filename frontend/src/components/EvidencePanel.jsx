import { severityColor } from '../utils/format';

const SEVERITY_DOT = {
  CRITICAL: 'bg-red-400',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-sky-400',
  INFO: 'bg-surface-500',
};

export default function EvidencePanel({ evidence = [] }) {
  return (
    <div className="card">
      <h3 className="card-header">Evidence Panel</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {evidence.length === 0 && (
          <p className="text-sm text-surface-500">No evidence collected yet.</p>
        )}
        {evidence.map((ev) => (
          <div
            key={ev.evidenceId}
            className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-800"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[ev.severity] || 'bg-surface-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-accent-400">{ev.evidenceId}</span>
                <span className={`text-xs font-medium ${severityColor(ev.severity)}`}>{ev.severity}</span>
              </div>
              <p className="text-sm text-surface-200 mt-0.5">{ev.description}</p>
              <p className="text-xs text-surface-500 mt-0.5">{ev.type} • {ev.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
