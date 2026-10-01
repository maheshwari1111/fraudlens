import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Filter, ShieldAlert } from 'lucide-react';
import { getAlerts } from '../services/api';
import { formatDateTime } from '../utils/format';
import PageTransition from '../components/PageTransition';

const SEVERITY_STYLE = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOW: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    getAlerts()
      .then((res) => setAlerts(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-red-400">Failed to load alerts: {error}</div>;

  const filteredAlerts = alerts.filter((a) => {
    const matchSearch =
      a.alertId.toLowerCase().includes(search.toLowerCase()) ||
      a.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      a.customerId.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchSearch && matchSev;
  });

  return (
    <PageTransition>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Security Telemetry Alerts
            </h1>
            <p className="text-xs text-surface-400 mt-1">Real-time anomalous signal trigger log</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alert ID or customer..."
                className="bg-surface-900/80 border border-surface-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-accent-500"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-surface-900/80 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none focus:border-accent-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-800 text-surface-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Alert ID</th>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Trigger Indicators</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50 text-sm">
                {filteredAlerts.map((a, i) => (
                  <motion.tr
                    key={a.alertId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-surface-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-accent-400">{a.alertId}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-surface-300">{a.transactionId}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-surface-300">{a.customerId}</td>
                    <td className="py-3.5 px-4">
                      <span className={`badge border ${SEVERITY_STYLE[a.severity] || 'bg-surface-700 text-surface-300'}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {a.triggerReasons.map((r) => (
                          <span key={r} className="text-[11px] bg-surface-800 text-surface-300 border border-surface-700/60 rounded-md px-2 py-0.5 font-mono">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-surface-300">{a.status}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-surface-400">{formatDateTime(a.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
