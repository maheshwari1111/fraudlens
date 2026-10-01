import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAlerts } from '../services/api';
import { formatDateTime } from '../utils/format';
import PageTransition from '../components/PageTransition';

const SEVERITY_STYLE = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  HIGH: 'text-orange-400 bg-orange-500/10',
  MEDIUM: 'text-amber-400 bg-amber-500/10',
  LOW: 'text-sky-400 bg-sky-500/10',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAlerts()
      .then((res) => setAlerts(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-red-400">Failed to load alerts: {error}</div>;

  return (
    <PageTransition>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Alerts</h1>
        <p className="text-surface-400 mb-6">Suspicious activity alerts requiring investigation</p>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="table-header text-left px-4 py-3">Alert ID</th>
                  <th className="table-header text-left px-4 py-3">Transaction</th>
                  <th className="table-header text-left px-4 py-3">Customer</th>
                  <th className="table-header text-left px-4 py-3">Severity</th>
                  <th className="table-header text-left px-4 py-3">Triggers</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <motion.tr
                    key={a.alertId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-surface-800/50 hover:bg-surface-800/30"
                  >
                    <td className="table-cell font-mono text-xs text-accent-400">{a.alertId}</td>
                    <td className="table-cell font-mono text-xs">{a.transactionId}</td>
                    <td className="table-cell">{a.customerId}</td>
                    <td className="table-cell">
                      <span className={`badge ${SEVERITY_STYLE[a.severity] || 'bg-surface-700 text-surface-300'}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {a.triggerReasons.map((r) => (
                          <span key={r} className="text-xs bg-surface-700 text-surface-300 rounded px-1.5 py-0.5">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell text-xs">{a.status}</td>
                    <td className="table-cell text-xs">{formatDateTime(a.createdAt)}</td>
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
