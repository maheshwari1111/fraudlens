import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, RefreshCw, XCircle, Loader2,
  ShieldAlert, User, Clock, ScrollText,
} from 'lucide-react';
import { formatDateTime } from '../utils/format';

const ACTIONS = [
  {
    action: 'CLOSE_APPROVE',
    label: 'Approve / Close',
    hint: 'Close the case as explained by the evidence.',
    icon: CheckCircle,
    className: 'btn-success',
  },
  {
    action: 'ESCALATE',
    label: 'Escalate',
    hint: 'Hand off to a senior investigator / further authority.',
    icon: AlertTriangle,
    className: 'btn-danger',
  },
  {
    action: 'REQUEST_INVESTIGATION',
    label: 'Request Additional Investigation',
    hint: 'Choose areas for a focused deep-dive and re-run the agents.',
    icon: RefreshCw,
    className: 'btn-warning',
  },
  {
    action: 'FALSE_POSITIVE',
    label: 'Mark False Positive',
    hint: 'Record that the activity was legitimate.',
    icon: XCircle,
    className: 'btn-secondary',
  },
];

const DECISION_STYLE = {
  CLOSE_APPROVE: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  ESCALATE: 'text-red-400 border-red-500/30 bg-red-500/10',
  REQUEST_INVESTIGATION: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  FALSE_POSITIVE: 'text-surface-300 border-surface-600 bg-surface-800/60',
};

/**
 * Human review — the decision point of the investigation.
 *
 * HIGH/CRITICAL cases can never close without an explicit decision here.
 * Every decision is written to the case record and the audit trail by the
 * backend. Wording stays neutral: this records risk indicators, it does not
 * declare anyone a fraudster.
 */
export default function HumanReviewPanel({ investigation, onReview, onOpenReinvestigate, submitting, error }) {
  const [note, setNote] = useState('');
  const decision = investigation.humanDecision?.action;
  const pending = investigation.status === 'AWAITING_HUMAN_REVIEW';
  const [busy, setBusy] = useState(null);

  const submit = async (action) => {
    if (action === 'REQUEST_INVESTIGATION') {
      // The area picker takes over; the decision is recorded with the areas.
      onOpenReinvestigate?.(note);
      return;
    }
    setBusy(action);
    await onReview(action, note);
    setNote('');
    setBusy(null);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Human Review
        </h3>
        {pending ? (
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
            DECISION REQUIRED
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold text-surface-400 bg-surface-800 border border-surface-700 px-2 py-1 rounded-md">
            {decision ? 'DECISION RECORDED' : 'NO ACTION REQUIRED'}
          </span>
        )}
      </div>

      {/* Recorded decision */}
      {decision && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border mb-4 ${DECISION_STYLE[decision] || DECISION_STYLE.FALSE_POSITIVE}`}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2">Recorded decision</p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 shrink-0" />
              <dt className="opacity-70">Reviewer</dt>
              <dd className="font-semibold ml-auto">{investigation.humanDecision.decidedBy || 'investigator'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5 shrink-0" />
              <dt className="opacity-70">Decision</dt>
              <dd className="font-semibold ml-auto uppercase">{decision.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <dt className="opacity-70">Timestamp</dt>
              <dd className="font-mono font-semibold ml-auto">{formatDateTime(investigation.humanDecision.decidedAt)}</dd>
            </div>
            {investigation.humanDecision.areas?.length > 0 && (
              <div className="flex items-start gap-2">
                <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <dt className="opacity-70">Areas requested</dt>
                <dd className="font-mono ml-auto text-right">{investigation.humanDecision.areas.join(', ')}</dd>
              </div>
            )}
            {investigation.humanDecision.note && (
              <div className="pt-1.5 mt-1.5 border-t border-current/20">
                <dt className="opacity-70 mb-1">Notes</dt>
                <dd className="text-surface-200 leading-relaxed">{investigation.humanDecision.note}</dd>
              </div>
            )}
          </dl>
        </motion.div>
      )}

      {pending ? (
        <>
          <p className="text-xs text-surface-400 mb-4 leading-relaxed">
            This case carries a HIGH or CRITICAL risk rating. It cannot close automatically — record an
            investigator decision. All actions are written to the audit trail.
          </p>

          <label className="block mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Reviewer note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Customer contacted and confirmed the travel; device swap verified."
              className="mt-1.5 w-full bg-surface-900/80 border border-surface-700 rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-600 focus:outline-none focus:border-accent-500 resize-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.action}
                onClick={() => submit(a.action)}
                disabled={submitting}
                title={a.hint}
                className={`${a.className} py-2.5 px-3 text-xs justify-start`}
              >
                {busy === a.action ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <a.icon className="w-3.5 h-3.5" />
                )}
                {a.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-surface-400 leading-relaxed flex-1 min-w-[220px]">
            {decision
              ? 'A decision has been recorded. You can re-open a deep-dive if further evidence is required.'
              : 'Risk rating is below HIGH, so no mandatory human decision is outstanding.'}
          </p>
          <button onClick={() => onOpenReinvestigate?.('')} disabled={submitting} className="btn-secondary py-2 px-3 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Request Additional Investigation
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{error}</p>
      )}

      <p className="text-[10px] text-surface-600 mt-4 pt-3 border-t border-surface-800/60 leading-relaxed">
        Recorded outcomes describe risk indicators only — “suspicious activity”, “unusual behaviour”,
        “human investigation required”. A case is never treated as proof of wrongdoing.
      </p>
    </div>
  );
}
