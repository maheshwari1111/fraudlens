import { formatDateTime } from '../utils/format';

export default function AuditTrail({ logs = [] }) {
  return (
    <div className="card">
      <h3 className="card-header">Audit Trail</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {logs.length === 0 && (
          <p className="text-sm text-surface-500">No audit entries yet.</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-800">
            <div className="w-2 h-2 rounded-full bg-accent-500 mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-surface-200">{log.action}</span>
                <span className="text-xs text-surface-500">{formatDateTime(log.timestamp)}</span>
              </div>
              {log.details?.note && (
                <p className="text-xs text-surface-400 mt-0.5">{log.details.note}</p>
              )}
              {log.details?.question && (
                <p className="text-xs text-surface-400 mt-0.5">Q: {log.details.question}</p>
              )}
              <p className="text-xs text-surface-500 mt-0.5">by {log.actor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
