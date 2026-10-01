import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCases } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import PageTransition from '../components/PageTransition';
import { formatDateTime } from '../utils/format';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCases()
      .then((res) => setCases(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-red-400">Failed to load cases: {error}</div>;

  return (
    <PageTransition>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Investigation Cases</h1>
        <p className="text-surface-400 mb-6">All fraud investigation cases</p>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="table-header text-left px-4 py-3">Case ID</th>
                  <th className="table-header text-left px-4 py-3">Customer</th>
                  <th className="table-header text-left px-4 py-3">Transaction</th>
                  <th className="table-header text-left px-4 py-3">Risk</th>
                  <th className="table-header text-left px-4 py-3">Score</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <motion.tr
                    key={c.caseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-surface-800/50 hover:bg-surface-800/30"
                  >
                    <td className="table-cell">
                      <Link to={`/cases/${c.caseId}`} className="text-accent-400 hover:text-accent-500 font-mono text-xs">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="table-cell">{c.customerId}</td>
                    <td className="table-cell font-mono text-xs">{c.transactionId}</td>
                    <td className="table-cell"><RiskBadge level={c.riskLevel} /></td>
                    <td className="table-cell font-mono text-xs">{c.riskScore}/100</td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                    <td className="table-cell text-xs">{formatDateTime(c.createdAt)}</td>
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
