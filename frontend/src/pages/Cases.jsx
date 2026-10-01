import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Search, Play, Loader2, X, ArrowRight, MapPin, Smartphone, IndianRupee, Filter } from 'lucide-react';
import { getCases, startInvestigation } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/format';

const REVIEW_STYLE = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  NOT_REQUIRED: 'text-surface-400 bg-surface-800 border-surface-700',
};

const selectClass =
  'bg-surface-900/80 border border-surface-700/80 rounded-lg px-2.5 py-2 text-[11px] text-surface-200 focus:outline-none focus:border-accent-500 cursor-pointer';

const reviewStyle = (status) =>
  status && status !== 'PENDING' && status !== 'NOT_REQUIRED'
    ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    : REVIEW_STYLE[status] || 'text-surface-400 bg-surface-800 border-surface-700';

/**
 * Case inventory — the entry point to the investigation workflow.
 * Every column is read from the case, transaction and customer records.
 */
export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [risk, setRisk] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCases({ status, risk });
      setCases(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, risk]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.trim().toLowerCase();
    return cases.filter(
      (c) =>
        c.caseId?.toLowerCase().includes(q) ||
        c.customerId?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.transactionId?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.deviceId?.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const hasFilters = search || status !== 'ALL' || risk !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setRisk('ALL');
  };

  const handleStart = async (c) => {
    setStarting(c.caseId);
    setActionError(null);
    try {
      await startInvestigation({ transactionId: c.transactionId, customerId: c.customerId, alertId: c.alertId });
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setStarting(null);
    }
  };

  const awaitingCount = cases.filter((c) => c.humanReviewStatus === 'PENDING').length;

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-accent-400" />
              Case Inventory
            </h1>
            <p className="text-xs text-surface-400 mt-1 leading-relaxed">
              Every case is an investigation with traceable evidence. {awaitingCount} awaiting a human decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-surface-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Case, customer, transaction, device, city…"
                className="w-64 bg-surface-900/80 border border-surface-700/80 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white placeholder-surface-500 focus:outline-none focus:border-accent-500"
              />
            </div>
            <select value={risk} onChange={(e) => setRisk(e.target.value)} className={selectClass} aria-label="Risk filter">
              <option value="ALL">All risk levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status filter">
              <option value="ALL">All statuses</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="AWAITING_HUMAN_REVIEW">Awaiting human review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="CLOSED">Closed</option>
              <option value="FALSE_POSITIVE">False positive</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary py-2 px-2.5 text-[11px]" title="Clear filters">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{actionError}</p>
        )}

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Loading case inventory…" />
          ) : error ? (
            <ErrorState error={error} onRetry={load} title="Cases unavailable" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={hasFilters ? Filter : Briefcase}
              title={hasFilters ? 'No cases match these filters' : 'No cases yet'}
              description={
                hasFilters
                  ? 'Try clearing the risk or status filter.'
                  : 'Start an investigation from an alert to open the first case.'
              }
              action={hasFilters ? <button onClick={clearFilters} className="btn-secondary py-2 px-3 text-xs">Clear filters</button> : null}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-900/40 text-surface-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Case</th>
                    <th className="py-3 px-4">Transaction</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Risk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Human Review</th>
                    <th className="py-3 px-4">Context</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/50 text-sm">
                  {filtered.map((c, i) => {
                    const notRun = (c.agentCount || 0) === 0;
                    return (
                      <motion.tr
                        key={c.caseId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 15) * 0.02 }}
                        className="hover:bg-surface-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link to={`/cases/${c.caseId}`} className="font-mono text-xs font-bold text-accent-400 hover:text-accent-300">
                            {c.caseId}
                          </Link>
                          <div className="text-[10px] text-surface-500 font-mono mt-0.5">
                            {c.evidenceCount || 0} EV • {c.agentCount || 0} agent{c.agentCount === 1 ? '' : 's'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-surface-300 whitespace-nowrap">{c.transactionId}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-surface-300">{c.customerId}</div>
                          {c.customerName && <div className="text-[10px] text-surface-500 truncate max-w-[130px]">{c.customerName}</div>}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-white text-right whitespace-nowrap">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono text-xs font-bold text-white">{c.riskScore ?? '—'}</span>
                            <RiskBadge level={c.riskLevel} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge border text-[10px] ${reviewStyle(c.humanReviewStatus)}`}>
                            {c.humanReviewStatus?.replace(/_/g, ' ') || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 text-[10px] text-surface-400 whitespace-nowrap">
                            {c.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-surface-500" />
                                {c.location}
                              </span>
                            )}
                            {c.deviceId && (
                              <span className="flex items-center gap-1 font-mono">
                                <Smartphone className="w-2.5 h-2.5 text-surface-500" />
                                {c.deviceId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end">
                            {notRun ? (
                              <button
                                onClick={() => handleStart(c)}
                                disabled={starting === c.caseId}
                                className="btn-primary py-1.5 px-2.5 text-[10px] whitespace-nowrap"
                              >
                                {starting === c.caseId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                Start Investigation
                              </button>
                            ) : (
                              <Link
                                to={`/cases/${c.caseId}`}
                                className="btn-secondary py-1.5 px-2.5 text-[10px] whitespace-nowrap"
                              >
                                Investigate
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-surface-600 flex items-center gap-1.5">
          <IndianRupee className="w-3 h-3" />
          {filtered.length} of {cases.length} case(s) shown. Risk score and level come from the deterministic risk engine.
        </p>
      </div>
    </PageTransition>
  );
}
