import { motion } from 'framer-motion';
import { User, Receipt, IndianRupee, Clock, MapPin, Smartphone, GitBranch, Scale, ClipboardCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import RiskBadge from './RiskBadge';
import { formatCurrency, formatTime, formatDateTime } from '../utils/format';

/**
 * Case header — the facts an investigator needs before making any decision,
 * plus the three investigation states (risk, pipeline status, human review).
 * Every value comes from the case/transaction/customer records.
 */
export default function CaseHeader({ investigation, transaction, customer, alert }) {
  const riskLevel = investigation.riskLevel;
  const decision = investigation.humanDecision?.action;

  const humanReview = (() => {
    if (investigation.status === 'AWAITING_HUMAN_REVIEW') return { label: 'PENDING', tone: 'text-amber-400' };
    if (decision) return { label: decision.replace(/_/g, ' '), tone: 'text-sky-400' };
    return { label: 'NOT REQUIRED', tone: 'text-surface-400' };
  })();

  const facts = [
    { icon: User, label: 'Customer', value: customer.customerId, sub: customer.name },
    { icon: Receipt, label: 'Transaction', value: transaction.transactionId, sub: transaction.transactionType?.replace(/_/g, ' ') },
    { icon: IndianRupee, label: 'Amount', value: formatCurrency(transaction.amount), sub: transaction.merchant },
    { icon: Clock, label: 'Time', value: formatTime(transaction.timestamp), sub: formatDateTime(transaction.timestamp) },
    { icon: MapPin, label: 'Location', value: transaction.location, sub: `Usual: ${(customer.usualLocations || []).join(', ') || '—'}` },
    { icon: Smartphone, label: 'Device', value: transaction.deviceId || 'None', sub: transaction.deviceId ? 'Device fingerprint' : 'No device on record' },
  ];

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white font-mono tracking-tight">{investigation.caseId}</h1>
            <StatusBadge status={investigation.status} />
            <RiskBadge level={riskLevel} size="lg" />
            {alert && (
              <span className="text-[11px] font-mono text-surface-400 bg-surface-900 border border-surface-800 px-2 py-1 rounded-md">
                {alert.alertId}
              </span>
            )}
          </div>
          <p className="text-xs text-surface-400 mt-1.5">
            {investigation.investigationCycles > 1
              ? `Investigation cycle ${investigation.investigationCycles} • last updated ${formatDateTime(investigation.updatedAt)}`
              : `Opened ${formatDateTime(investigation.createdAt)}`}
          </p>
        </div>
      </div>

      {/* Three investigation states */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/25 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-accent-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Risk Score</p>
            <p className="text-lg font-bold text-white font-mono leading-tight">
              {investigation.riskScore}
              <span className="text-xs text-surface-500">/100</span>
            </p>
          </div>
        </div>
        <div className="card py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Investigation Status</p>
            <p className="text-sm font-bold text-white leading-tight mt-0.5 truncate">{investigation.status.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="card py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Human Review</p>
            <p className={`text-sm font-bold leading-tight mt-0.5 truncate ${humanReview.tone}`}>{humanReview.label}</p>
          </div>
        </div>
      </div>

      {/* Case facts */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {facts.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-surface-900/60 border border-surface-800/80 rounded-xl px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <f.icon className="w-3 h-3 text-surface-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">{f.label}</p>
            </div>
            <p className="text-sm font-bold text-white font-mono truncate" title={String(f.value)}>{f.value}</p>
            {f.sub && <p className="text-[10px] text-surface-500 truncate" title={String(f.sub)}>{f.sub}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
