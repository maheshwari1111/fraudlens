import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Search, Play, Loader2, Filter, X, MapPin, Smartphone, IndianRupee } from 'lucide-react';
import { getAlerts, startInvestigation } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const SEVERITY_STYLE = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOW: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
};

const STATUS_STYLE = {
  OPEN: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  UNDER_INVESTIGATION: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  RESOLVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  FALSE_POSITIVE: 'text-surface-400 bg-surface-800 border-surface-700',
};

const selectClass =
  'bg-surface-900/80 border border-surface-700/80 rounded-lg px-2.5 py-2 text-[11px] text-surface-200 focus:outline-none focus:border-accent-500 cursor-pointer';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts({ severity, status, from, to });
      setAlerts(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [severity, status, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // Text search is applied client-side to keep typing responsive; the other
  // filters are server-side so they exercise the real query path.
  const filtered = useMemo(() => {
    if (!search.trim()) return alerts;
    const q = search.trim().toLowerCase();
    return alerts.filter(
      (a) =>
        a.alertId?.toLowerCase().includes(q) ||
        a.transactionId?.toLowerCase().includes(q) ||
        a.customerId?.toLowerCase().includes(q) ||
        a.customerName?.toLowerCase().includes(q) ||
        a.deviceId?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
    );
  }, [alerts, search]);

  const hasFilters = search || severity !== 'ALL' || status !== 'ALL' || from || to;

  const clearFilters = () => {
    setSearch('');
    setSeverity('ALL');
    setStatus('ALL');
    setFrom('');
    setTo('');
  };

  // Real workflow: POST /api/investigations/start, then land on the case.
  const handleStart = async (alert) => {
    setStarting(alert.alertId);
    setActionError(null);
    try {
      const res = await startInvestigation({
        alertId: alert.alertId,
        transactionId: alert.transactionId,
        customerId: alert.customerId,
      });
      const caseId = res.data?.caseId || alert.caseId;
      navigate(`/cases/${caseId}`);
    } catch (err) {
      setActionError(err.message);
      setStarting(null);
    }
  };

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Alert Triage
            </h1>
            <p className="text-xs text-surface-400 mt-1 leading-relaxed">
              Signals that require triage. An alert is a prompt to investigate — not a conclusion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-surface-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Alert, transaction, customer, device, city…"
                className="w-64 bg-surface-900/80 border border-surface-700/80 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white placeholder-surface-500 focus:outline-none focus:border-accent-500"
              />
            </div>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass} aria-label="Risk filter">
              <option value="ALL">All risk levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status filter">
              <option value="ALL">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_INVESTIGATION">Under investigation</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False positive</option>
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={selectClass}
                title="Created from"
                aria-label="From date"
              />
              <span className="text-surface-600 text-[11px]">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={selectClass}
                title="Created to"
                aria-label="To date"
              />
            </div>
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

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Loading alerts…" />
          ) : error ? (
            <ErrorState error={error} onRetry={load} title="Alerts unavailable" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Filter}
              title={hasFilters ? 'No alerts match these filters' : 'No alerts recorded'}
              description={
                hasFilters
                  ? 'Try widening the risk level, status or date range.'
                  : 'Alerts appear here when the monitoring rules flag a transaction.'
              }
              action={hasFilters ? <button onClick={clearFilters} className="btn-secondary py-2 px-3 text-xs">Clear filters</button> : null}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-900/40 text-surface-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Alert</th>
                    <th className="py-3 px-4">Transaction</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Risk</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/50 text-sm">
                  {filtered.map((a, i) => (
                    <motion.tr
                      key={a.alertId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 15) * 0.02 }}
                      className="hover:bg-surface-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-accent-400">{a.alertId}</span>
                        {a.triggerReasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {a.triggerReasons.slice(0, 2).map((r) => (
                              <span key={r} className="text-[9px] font-mono text-surface-400 bg-surface-900 border border-surface-800 rounded px-1 py-0.5">
                                {r}
                              </span>
                            ))}
                            {a.triggerReasons.length > 2 && (
                              <span className="text-[9px] font-mono text-surface-500">+{a.triggerReasons.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-surface-300 whitespace-nowrap">{a.transactionId}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-surface-300">{a.customerId}</div>
                        {a.customerName && <div className="text-[10px] text-surface-500 truncate max-w-[130px]">{a.customerName}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-white text-right whitespace-nowrap">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge border text-[10px] ${SEVERITY_STYLE[a.severity] || 'bg-surface-800 text-surface-300 border-surface-700'}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-surface-300">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <MapPin className="w-3 h-3 text-surface-500 shrink-0" />
                          {a.location || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-surface-400 whitespace-nowrap">
                          <Smartphone className="w-3 h-3 text-surface-500 shrink-0" />
                          {a.deviceId || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge border text-[10px] ${STATUS_STYLE[a.status] || 'bg-surface-800 text-surface-300 border-surface-700'}`}>
                          {a.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono text-surface-400 whitespace-nowrap">
                        {formatDateTime(a.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.hasCase ? (
                            <Link to={`/cases/${a.caseId}`} className="btn-secondary py-1.5 px-2.5 text-[10px] whitespace-nowrap">
                              View Case
                            </Link>
                          ) : (
                            <span
                              className="text-[10px] text-surface-500 font-mono px-2 py-1.5 border border-surface-800 rounded-lg whitespace-nowrap"
                              title="No investigation has been run for this alert yet"
                            >
                              No case
                            </span>
                          )}
                          <button
                            onClick={() => handleStart(a)}
                            disabled={starting === a.alertId}
                            className="btn-primary py-1.5 px-2.5 text-[10px] whitespace-nowrap"
                          >
                            {starting === a.alertId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            {a.hasCase ? 'Re-run' : 'Start Investigation'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-surface-600 flex items-center gap-1.5">
          <IndianRupee className="w-3 h-3" />
          {filtered.length} of {alerts.length} alert(s) shown. Amount, location and device are read from the
          transaction record; severity and status from the alert.
        </p>
      </div>
    </PageTransition>
  );
}
