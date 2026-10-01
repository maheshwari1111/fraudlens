import { motion } from 'framer-motion';
import { HelpCircle, ShieldQuestion, Info } from 'lucide-react';
import RiskBadge from './RiskBadge';

const FACTOR_LABEL = {
  AMOUNT_ANOMALY: 'Amount anomaly',
  NEW_DEVICE: 'New device',
  NEW_LOCATION: 'New location',
  UNUSUAL_TIME: 'Unusual time',
  PREVIOUS_ALERT: 'Previous alert',
  SHARED_DEVICE: 'Shared device',
};

const factorLabel = (type) =>
  FACTOR_LABEL[type] ||
  String(type || '').toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const BAR_COLOR = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

/**
 * "WHY HIGH RISK?" — shows the deterministic breakdown.
 *
 * This component never computes a score. It renders `investigation.riskScore`
 * and `investigation.riskFactors` exactly as produced by the backend Risk
 * Engine (backend/src/services/agents/riskEngine.js), and every factor links
 * to the evidence IDs that triggered it.
 */
export default function RiskBreakdown({ investigation, onFocusEvidence, activeEvidenceId }) {
  const { riskScore = 0, riskLevel = 'LOW', riskFactors = [] } = investigation;
  const hasScore = investigation.riskScore > 0 || riskFactors.length > 0;
  const totalWeight = riskFactors.reduce((s, f) => s + (f.weight || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Why {riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'High Risk' : 'This Rating'}?
        </h3>
        <RiskBadge level={riskLevel} />
      </div>

      {!hasScore && (
        <p className="text-sm text-surface-500">
          No risk factors recorded. Run the investigation to calculate a score.
        </p>
      )}

      {hasScore && (
        <>
          <div className="space-y-2 mb-4">
            {riskFactors.map((f, i) => {
              const ids = f.evidenceIds || [];
              return (
                <motion.div
                  key={`${f.type}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="p-3 rounded-xl bg-surface-800/40 border border-surface-800 hover:border-surface-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{factorLabel(f.type)}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{f.description}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400 shrink-0">+{f.weight}</span>
                  </div>

                  {ids.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-surface-800/70">
                      <span className="text-[10px] uppercase tracking-widest text-surface-500 font-bold">Evidence</span>
                      {ids.map((id) => (
                        <button
                          key={id}
                          onClick={() => onFocusEvidence?.(id)}
                          title={`Show ${id} in the evidence panel`}
                          className={`text-[11px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                            activeEvidenceId === id
                              ? 'bg-accent-500/20 border-accent-400/50 text-accent-200'
                              : 'bg-accent-600/10 border-accent-500/25 text-accent-400 hover:bg-accent-500/20 hover:text-accent-300'
                          }`}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Score footer */}
          <div className="pt-3 border-t border-surface-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-surface-400">Risk Score</span>
              <span className="text-lg font-bold text-white font-mono">
                {riskScore}
                <span className="text-xs text-surface-500">/100</span>
              </span>
            </div>
            <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${BAR_COLOR[riskLevel] || 'bg-accent-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(riskScore, 100)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
            {totalWeight > riskScore && (
              <p className="text-[11px] text-surface-500 mt-1.5">
                Sum of weights {totalWeight}, capped at 100.
              </p>
            )}
            <p className="text-[11px] text-surface-600 mt-2 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Demonstrative rule set, not a universal financial risk standard. Weights are fixed and
                configurable via <code className="text-surface-500">RISK_WEIGHTS</code>. The score is a sum of
                weighted rules, not a probability of fraud.
              </span>
            </p>
          </div>
        </>
      )}

      {!hasScore && (
        <p className="text-[11px] text-surface-600 mt-3 flex items-start gap-1.5">
          <ShieldQuestion className="w-3 h-3 mt-0.5 shrink-0" />
          Risk is computed only by the deterministic Risk Engine, never by the language model.
        </p>
      )}
    </div>
  );
}
