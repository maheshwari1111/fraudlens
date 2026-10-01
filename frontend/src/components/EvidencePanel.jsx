import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Fingerprint } from 'lucide-react';
import EmptyState from './EmptyState';

const SEVERITY = {
  CRITICAL: { dot: 'bg-red-400', text: 'text-red-400', ring: 'ring-red-500/30', bg: 'bg-red-500/5' },
  HIGH: { dot: 'bg-orange-400', text: 'text-orange-400', ring: 'ring-orange-500/30', bg: 'bg-orange-500/5' },
  MEDIUM: { dot: 'bg-amber-400', text: 'text-amber-400', ring: 'ring-amber-500/30', bg: 'bg-amber-500/5' },
  LOW: { dot: 'bg-sky-400', text: 'text-sky-400', ring: 'ring-sky-500/30', bg: 'bg-sky-500/5' },
  INFO: { dot: 'bg-surface-500', text: 'text-surface-400', ring: 'ring-surface-700', bg: '' },
};

const typeLabel = (t) =>
  String(t || '')
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Evidence panel — every item is registered by an agent and carries a stable
 * ID (EV-001…). Nothing here is inferred client-side.
 *
 * `highlightId` lets another panel (e.g. the risk breakdown) scroll to and
 * flash a specific evidence item.
 */
export default function EvidencePanel({ evidence = [], highlightId, onHighlightHandled }) {
  const itemRefs = useRef({});

  useEffect(() => {
    if (!highlightId) return;
    const el = itemRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => onHighlightHandled?.(), 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [highlightId, onHighlightHandled]);

  const bySeverity = evidence.reduce(
    (acc, e) => ({ ...acc, [e.severity]: (acc[e.severity] || 0) + 1 }),
    {}
  );

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-accent-400" />
          Evidence
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-md">
            {evidence.length} item{evidence.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Severity tally */}
      {evidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-surface-800/70">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].filter((s) => bySeverity[s]).map((s) => (
            <span key={s} className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border border-surface-800 bg-surface-900 ${SEVERITY[s].text}`}>
              {bySeverity[s]} {s}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
        {evidence.length === 0 ? (
          <EmptyState
            compact
            icon={FileSearch}
            title="No evidence recorded"
            description="Evidence appears here as the analysis agents complete. Every finding will carry a traceable ID."
          />
        ) : (
          evidence.map((ev, i) => {
            const s = SEVERITY[ev.severity] || SEVERITY.INFO;
            const isHighlighted = highlightId === ev.evidenceId;
            return (
              <motion.div
                key={ev.evidenceId}
                ref={(el) => {
                  if (el) itemRefs.current[ev.evidenceId] = el;
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isHighlighted
                    ? `${s.bg} border-accent-400/60 ring-2 ${s.ring}`
                    : 'bg-surface-800/40 border-surface-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-accent-400">{ev.evidenceId}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{ev.severity}</span>
                      <span className="text-[10px] font-mono text-surface-500 bg-surface-950/60 border border-surface-800 px-1.5 py-0.5 rounded">
                        {typeLabel(ev.type)}
                      </span>
                    </div>
                    <p className="text-sm text-surface-200 mt-1 leading-relaxed">{ev.description}</p>
                    <p className="text-[11px] text-surface-500 mt-1 font-mono">source: {ev.source}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
