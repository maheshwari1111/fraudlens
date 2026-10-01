import { ScrollText, User, Clock } from 'lucide-react';
import EmptyState from './EmptyState';
import { formatDateTime } from '../utils/format';

const ACTION_STYLE = {
  INVESTIGATION_COMPLETED: 'border-emerald-500/30 bg-emerald-500/5',
  REINVESTIGATION_COMPLETED: 'border-accent-500/30 bg-accent-500/5',
  HUMAN_REVIEW_ESCALATE: 'border-red-500/30 bg-red-500/5',
  HUMAN_REVIEW_CLOSE_APPROVE: 'border-emerald-500/30 bg-emerald-500/5',
  HUMAN_REVIEW_FALSE_POSITIVE: 'border-surface-700 bg-surface-800/40',
  HUMAN_REVIEW_REQUEST_INVESTIGATION: 'border-amber-500/30 bg-amber-500/5',
  COPILOT_QUERY: 'border-sky-500/25 bg-sky-500/5',
};

const humanize = (action = '') =>
  action
    .replace(/^HUMAN_REVIEW_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

/** Detail rows worth surfacing, read straight from the audit record. */
function detailRows(details = {}) {
  const rows = [];
  if (details.riskScore != null) rows.push(['Risk', `${details.riskScore}/100 (${details.riskLevel || '—'})`]);
  if (details.evidenceCount != null) rows.push(['Evidence', `${details.evidenceCount} item(s)`]);
  if (details.agentCount != null) rows.push(['Agents', `${details.agentCount} executed`]);
  if (details.cycle != null) rows.push(['Cycle', String(details.cycle)]);
  if (details.focusAreaLabels?.length) rows.push(['Deep-dive areas', details.focusAreaLabels.join(', ')]);
  if (details.requestedAreaLabels?.length) rows.push(['Areas requested', details.requestedAreaLabels.join(', ')]);
  if (details.duration != null) rows.push(['Duration', `${details.duration}ms`]);
  return rows;
}

/**
 * Audit trail — the immutable record of what happened on a case.
 * Every investigation run, re-investigation and human decision is written here
 * by the backend, including who acted, when, and on what basis.
 */
export default function AuditTrail({ logs = [] }) {
  return (
    <div className="card flex flex-col h-[30rem]">
      <div className="flex items-center justify-between pb-3 border-b border-surface-800/80 mb-3 shrink-0">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-accent-400" />
          Audit Trail
        </h3>
        <span className="text-[11px] font-mono font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-md shrink-0">
          {logs.length} entr{logs.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mx-1 px-1">
        {logs.length === 0 ? (
          <EmptyState
            compact
            icon={ScrollText}
            title="No audit entries"
            description="Every agent run and human decision on this case will be recorded here."
          />
        ) : (
          logs.map((log, i) => {
            const rows = detailRows(log.details);
            return (
              <div
                key={log._id || `${log.action}-${i}`}
                className={`p-3 rounded-xl border ${ACTION_STYLE[log.action] || 'border-surface-800 bg-surface-800/30'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-surface-100">{humanize(log.action)}</p>
                  <span className="text-[10px] font-mono text-surface-500 shrink-0 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>

                {log.details?.question && (
                  <p className="text-[11px] text-surface-400 mt-1 italic">Q: {log.details.question}</p>
                )}
                {log.details?.note && (
                  <p className="text-[11px] text-surface-300 mt-1 leading-relaxed">{log.details.note}</p>
                )}

                {rows.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-surface-800/60 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {rows.map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-[10px] text-surface-500 shrink-0">{k}</span>
                        <span className="text-[10px] font-mono text-surface-300 truncate" title={v}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-surface-600 mt-1.5 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  {log.actor || 'system'}
                  <span className="flex items-center gap-1 ml-2">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
