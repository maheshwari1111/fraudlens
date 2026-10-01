import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { getCases } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import PageTransition from '../components/PageTransition';
import { formatDateTime } from '../utils/format';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    getCases()
      .then((res) => setCases(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-red-400">Failed to load cases: {error}</div>;

  const filteredCases = cases.filter((c) => {
    const matchSearch =
      c.caseId.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.transactionId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <PageTransition>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-accent-400" />
              Investigation Case Repository
            </h1>
            <p className="text-xs text-surface-400 mt-1">Multi-agent investigation case inventory & audit index</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case ID, customer..."
                className="bg-surface-900/80 border border-surface-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-accent-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-900/80 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none focus:border-accent-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AWAITING_HUMAN_REVIEW">Awaiting Human Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="NEW">New</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-800 text-surface-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Case ID</th>
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Risk Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50 text-sm">
                {filteredCases.map((c, i) => (
                  <motion.tr
                    key={c.caseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-surface-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <Link to={`/cases/${c.caseId}`} className="text-accent-400 group-hover:text-accent-300 font-mono text-xs font-bold">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-surface-300">{c.customerId}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-surface-300">{c.transactionId}</td>
                    <td className="py-3.5 px-4"><RiskBadge level={c.riskLevel} /></td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-white">{c.riskScore}/100</td>
                    <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3.5 px-4 text-xs font-mono text-surface-400">{formatDateTime(c.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/cases/${c.caseId}`} className="btn-primary py-1 px-3 text-xs">
                        Open Case
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
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
